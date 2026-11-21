import { Request, Response } from 'express';
import { query } from '../database/db.js';

export async function getWishlist(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    let wishlistRes = await query(`SELECT id FROM wishlists WHERE user_id = $1`, [userId]);
    if (wishlistRes.rows.length === 0) {
      wishlistRes = await query(`INSERT INTO wishlists (user_id) VALUES ($1) RETURNING id;`, [userId]);
    }

    const wishlistId = wishlistRes.rows[0].id;
    const itemsRes = await query(`
      SELECT 
        wi.id as item_id,
        wi.added_at,
        p.id as product_id,
        p.name,
        p.slug,
        p.brand,
        p.base_price,
        p.discount_percent,
        ROUND((p.base_price * (1 - p.discount_percent / 100))::numeric, 2) AS final_price,
        p.rating,
        COALESCE(pi.image_url, '') as image_url,
        (COALESCE(SUM(i.quantity), 0) > 0) as in_stock
      FROM wishlist_items wi
      JOIN products p ON wi.product_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE wi.wishlist_id = $1
      GROUP BY wi.id, wi.added_at, p.id, p.name, p.slug, p.brand, p.base_price, p.discount_percent, p.rating, pi.image_url
      ORDER BY wi.added_at DESC;
    `, [wishlistId]);

    res.json({ success: true, items: itemsRes.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve wishlist' });
  }
}

export async function addToWishlist(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { productId } = req.body;

    let wishlistRes = await query(`SELECT id FROM wishlists WHERE user_id = $1`, [userId]);
    if (wishlistRes.rows.length === 0) {
      wishlistRes = await query(`INSERT INTO wishlists (user_id) VALUES ($1) RETURNING id;`, [userId]);
    }
    const wishlistId = wishlistRes.rows[0].id;

    await query(`
      INSERT INTO wishlist_items (wishlist_id, product_id)
      VALUES ($1, $2)
      ON CONFLICT (wishlist_id, product_id) DO NOTHING;
    `, [wishlistId, productId]);

    res.json({ success: true, message: 'Added to wishlist' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to add to wishlist' });
  }
}

export async function removeFromWishlist(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { productId } = req.params;

    const wishlistRes = await query(`SELECT id FROM wishlists WHERE user_id = $1`, [userId]);
    if (wishlistRes.rows.length > 0) {
      await query(`
        DELETE FROM wishlist_items WHERE wishlist_id = $1 AND product_id = $2;
      `, [wishlistRes.rows[0].id, productId]);
    }

    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to remove from wishlist' });
  }
}
