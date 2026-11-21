import { Request, Response } from 'express';
import { query } from '../database/db.js';
import { searchProducts } from '../opensearch/searchService.js';

export async function getProducts(req: Request, res: Response): Promise<void> {
  try {
    const { category, brand, minPrice, maxPrice, minRating, inStockOnly, city, sortBy, page, limit } = req.query;

    const result = await searchProducts({
      category: category as string,
      brand: brand as string,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      minRating: minRating ? parseFloat(minRating as string) : undefined,
      inStockOnly: inStockOnly === 'true',
      city: city as string,
      sortBy: sortBy as any,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 12,
    });

    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve products' });
  }
}

export async function search(req: Request, res: Response): Promise<void> {
  try {
    const { q, category, brand, minPrice, maxPrice, minRating, inStockOnly, city, sortBy, page, limit } = req.query;

    const result = await searchProducts({
      q: q as string,
      category: category as string,
      brand: brand as string,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      minRating: minRating ? parseFloat(minRating as string) : undefined,
      inStockOnly: inStockOnly === 'true',
      city: city as string,
      sortBy: sortBy as any,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 12,
    });

    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Search operation failed' });
  }
}

export async function getProductBySlug(req: Request, res: Response): Promise<void> {
  try {
    const { slug } = req.params;

    const prodRes = await query(`
      SELECT 
        p.id, p.name, p.slug, p.description, p.brand, p.base_price, p.discount_percent,
        ROUND((p.base_price * (1 - p.discount_percent / 100))::numeric, 2) AS final_price,
        p.rating, p.review_count, p.created_at,
        c.id as category_id, c.name AS category_name, c.slug AS category_slug,
        COALESCE(SUM(i.quantity), 0)::integer AS stock,
        (COALESCE(SUM(i.quantity), 0) > 0) AS in_stock
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.slug = $1 AND p.is_active = TRUE
      GROUP BY p.id, c.id, c.name, c.slug;
    `, [slug]);

    if (prodRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }

    const product = prodRes.rows[0];

    // Fetch images
    const imagesRes = await query(`
      SELECT id, image_url, alt_text, is_primary, display_order
      FROM product_images
      WHERE product_id = $1
      ORDER BY is_primary DESC, display_order ASC;
    `, [product.id]);

    // Fetch reviews
    const reviewsRes = await query(`
      SELECT r.id, r.rating, r.title, r.comment, r.created_at, u.full_name as author_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC
      LIMIT 10;
    `, [product.id]);

    res.json({
      success: true,
      product: {
        ...product,
        images: imagesRes.rows,
        reviews: reviewsRes.rows,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve product details' });
  }
}

export async function getCategories(req: Request, res: Response): Promise<void> {
  try {
    const catsRes = await query(`
      SELECT c.id, c.name, c.slug, c.description, c.image_url, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = TRUE
      GROUP BY c.id
      ORDER BY c.id ASC;
    `);
    res.json({ success: true, categories: catsRes.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve categories' });
  }
}
