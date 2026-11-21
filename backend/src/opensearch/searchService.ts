import { getOpenSearchClient, isOpenSearchLive } from './client.js';
import { OPENSEARCH_INDEX } from './indexManager.js';
import { query } from '../database/db.js';

export interface SearchParams {
  q?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
  city?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'rating_desc' | 'newest';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  products: any[];
  total: number;
  page: number;
  totalPages: number;
  source: 'opensearch' | 'postgresql_fallback';
}

/**
 * Intelligent search query parser (e.g. "bluetoth hedphones under 1500")
 */
export function parseNaturalQuery(rawQuery: string): { cleanedQuery: string; detectedBudget?: number } {
  let cleaned = rawQuery.trim();
  let detectedBudget: number | undefined;

  // Match "under 1500", "below ₹2000", "< 3000"
  const underMatch = cleaned.match(/(?:under|below|less than|within|<)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i);
  if (underMatch) {
    detectedBudget = parseInt(underMatch[1], 10);
    cleaned = cleaned.replace(underMatch[0], '').trim();
  }

  return { cleanedQuery: cleaned, detectedBudget };
}

export async function searchProducts(params: SearchParams): Promise<SearchResult> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(50, params.limit || 12));
  const from = (page - 1) * limit;

  let queryText = params.q || '';
  let budgetFilter = params.maxPrice;

  if (queryText) {
    const parsed = parseNaturalQuery(queryText);
    queryText = parsed.cleanedQuery;
    if (parsed.detectedBudget && !budgetFilter) {
      budgetFilter = parsed.detectedBudget;
    }
  }

  // Attempt Aiven OpenSearch search first
  if (isOpenSearchLive()) {
    try {
      const client = getOpenSearchClient();
      const mustClauses: any[] = [];
      const filterClauses: any[] = [];

      if (queryText) {
        mustClauses.push({
          multi_match: {
            query: queryText,
            fields: ['name^3', 'brand^2', 'category', 'description'],
            fuzziness: 'AUTO',
            prefix_length: 2,
            operator: 'or',
          },
        });
      } else {
        mustClauses.push({ match_all: {} });
      }

      if (params.category) {
        filterClauses.push({
          term: { category_slug: params.category.toLowerCase() },
        });
      }

      if (params.brand) {
        filterClauses.push({
          term: { brand: params.brand },
        });
      }

      if (params.minPrice !== undefined || budgetFilter !== undefined) {
        const range: any = {};
        if (params.minPrice !== undefined) range.gte = params.minPrice;
        if (budgetFilter !== undefined) range.lte = budgetFilter;
        filterClauses.push({ range: { final_price: range } });
      }

      if (params.minRating !== undefined) {
        filterClauses.push({
          range: { rating: { gte: params.minRating } },
        });
      }

      if (params.inStockOnly) {
        filterClauses.push({
          term: { in_stock: true },
        });
      }

      if (params.city) {
        filterClauses.push({
          term: { warehouse_city: params.city },
        });
      }

      // Sorting
      const sortRules: any[] = [];
      if (params.sortBy === 'price_asc') {
        sortRules.push({ final_price: { order: 'asc' } });
      } else if (params.sortBy === 'price_desc') {
        sortRules.push({ final_price: { order: 'desc' } });
      } else if (params.sortBy === 'rating_desc') {
        sortRules.push({ rating: { order: 'desc' } });
      } else if (params.sortBy === 'newest') {
        sortRules.push({ created_at: { order: 'desc' } });
      } else if (queryText) {
        sortRules.push({ _score: { order: 'desc' } });
      }

      const searchResponse = await client.search({
        index: OPENSEARCH_INDEX,
        body: {
          from,
          size: limit,
          query: {
            bool: {
              must: mustClauses,
              filter: filterClauses,
            },
          },
          sort: sortRules.length > 0 ? sortRules : undefined,
        },
      });

      const hits = searchResponse.body.hits;
      const total = typeof hits.total === 'number' ? hits.total : hits.total.value;
      const products = hits.hits.map((h: any) => h._source);

      return {
        products,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        source: 'opensearch',
      };
    } catch (osErr: any) {
      console.warn('[OpenSearch] Query failed, falling back to PostgreSQL:', osErr.message);
    }
  }

  // Fallback: Query PostgreSQL directly
  return searchPostgresFallback(queryText, params, budgetFilter, page, limit, from);
}

async function searchPostgresFallback(
  queryText: string,
  params: SearchParams,
  budgetFilter: number | undefined,
  page: number,
  limit: number,
  from: number
): Promise<SearchResult> {
  try {
    const whereConditions: string[] = ['p.is_active = TRUE'];
    const sqlParams: any[] = [];

    if (queryText) {
      sqlParams.push(`%${queryText}%`);
      whereConditions.push(`(p.name ILIKE $${sqlParams.length} OR p.description ILIKE $${sqlParams.length} OR p.brand ILIKE $${sqlParams.length} OR c.name ILIKE $${sqlParams.length})`);
    }

    if (params.category) {
      sqlParams.push(params.category.toLowerCase());
      whereConditions.push(`c.slug = $${sqlParams.length}`);
    }

    if (params.brand) {
      sqlParams.push(params.brand);
      whereConditions.push(`p.brand = $${sqlParams.length}`);
    }

    if (params.minPrice !== undefined) {
      sqlParams.push(params.minPrice);
      whereConditions.push(`(p.base_price * (1 - p.discount_percent / 100)) >= $${sqlParams.length}`);
    }

    if (budgetFilter !== undefined) {
      sqlParams.push(budgetFilter);
      whereConditions.push(`(p.base_price * (1 - p.discount_percent / 100)) <= $${sqlParams.length}`);
    }

    if (params.minRating !== undefined) {
      sqlParams.push(params.minRating);
      whereConditions.push(`p.rating >= $${sqlParams.length}`);
    }

    if (params.city) {
      sqlParams.push(params.city);
      whereConditions.push(`w.city ILIKE $${sqlParams.length}`);
    }

    const whereClause = whereConditions.join(' AND ');

    let orderByClause = 'ORDER BY p.created_at DESC';
    if (params.sortBy === 'price_asc') {
      orderByClause = 'ORDER BY (p.base_price * (1 - p.discount_percent / 100)) ASC';
    } else if (params.sortBy === 'price_desc') {
      orderByClause = 'ORDER BY (p.base_price * (1 - p.discount_percent / 100)) DESC';
    } else if (params.sortBy === 'rating_desc') {
      orderByClause = 'ORDER BY p.rating DESC';
    }

    const countRes = await query(`
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      WHERE ${whereClause};
    `, sqlParams);

    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const dataRes = await query(`
      SELECT 
        p.id, p.name, p.slug, p.description, p.brand, p.base_price, p.discount_percent,
        ROUND((p.base_price * (1 - p.discount_percent / 100))::numeric, 2) AS final_price,
        p.rating, p.review_count, p.created_at,
        c.name AS category, c.slug AS category_slug,
        COALESCE(pi.image_url, '') AS image_url,
        COALESCE(SUM(i.quantity), 0)::integer AS stock,
        (COALESCE(SUM(i.quantity), 0) > 0) AS in_stock,
        COALESCE(w.city, 'Mumbai') AS warehouse_city
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
      LEFT JOIN inventory i ON p.id = i.product_id
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      WHERE ${whereClause}
      GROUP BY p.id, c.name, c.slug, pi.image_url, w.city
      ${orderByClause}
      LIMIT ${limit} OFFSET ${from};
    `, sqlParams);

    return {
      products: dataRes.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      source: 'postgresql_fallback',
    };
  } catch (dbErr: any) {
    console.warn('[Search] Fallback query error:', dbErr.message);
    return {
      products: [],
      total: 0,
      page: 1,
      totalPages: 0,
      source: 'postgresql_fallback',
    };
  }
}
