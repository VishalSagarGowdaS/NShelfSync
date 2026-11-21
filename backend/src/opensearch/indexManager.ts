import { getOpenSearchClient, isOpenSearchLive, testOpenSearchConnection } from './client.js';
import { env } from '../config/env.js';
import { query } from '../database/db.js';

export const OPENSEARCH_INDEX = env.OPENSEARCH_INDEX || 'shelfsync_products';

export async function createProductIndex(): Promise<boolean> {
  const client = getOpenSearchClient();
  const conn = await testOpenSearchConnection();
  if (!conn.connected) {
    console.warn('[OpenSearch] Cannot create index: OpenSearch cluster unreachable.');
    return false;
  }

  try {
    const exists = await client.indices.exists({ index: OPENSEARCH_INDEX });
    if (exists.body) {
      console.log(`[OpenSearch] Index '${OPENSEARCH_INDEX}' already exists.`);
      return true;
    }

    console.log(`[OpenSearch] Creating index '${OPENSEARCH_INDEX}' with full-text, fuzzy & autocomplete mappings...`);
    await client.indices.create({
      index: OPENSEARCH_INDEX,
      body: {
        settings: {
          analysis: {
            filter: {
              autocomplete_filter: {
                type: 'edge_ngram',
                min_gram: 2,
                max_gram: 15,
              },
            },
            analyzer: {
              autocomplete: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'autocomplete_filter'],
              },
              autocomplete_search: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase'],
              },
            },
          },
        },
        mappings: {
          properties: {
            id: { type: 'keyword' },
            name: {
              type: 'text',
              analyzer: 'autocomplete',
              search_analyzer: 'autocomplete_search',
              fields: {
                raw: { type: 'keyword' },
              },
            },
            slug: { type: 'keyword' },
            description: { type: 'text' },
            brand: { type: 'keyword' },
            category: { type: 'keyword' },
            category_slug: { type: 'keyword' },
            base_price: { type: 'float' },
            discount_percent: { type: 'float' },
            final_price: { type: 'float' },
            rating: { type: 'float' },
            review_count: { type: 'integer' },
            image_url: { type: 'keyword', index: false },
            in_stock: { type: 'boolean' },
            stock: { type: 'integer' },
            warehouse_city: { type: 'keyword' },
            created_at: { type: 'date' },
          },
        },
      },
    });

    console.log(`[OpenSearch] Index '${OPENSEARCH_INDEX}' created successfully.`);
    return true;
  } catch (err: any) {
    console.error('[OpenSearch] Failed to create index:', err.message);
    return false;
  }
}

export async function indexProduct(productDoc: any): Promise<boolean> {
  try {
    const client = getOpenSearchClient();
    await client.index({
      index: OPENSEARCH_INDEX,
      id: productDoc.id,
      body: productDoc,
      refresh: true,
    });
    return true;
  } catch (err: any) {
    console.warn(`[OpenSearch] Indexing failed for product ${productDoc.id}:`, err.message);
    return false;
  }
}

export async function updateOpenSearchProductStock(productId: string, newStock: number): Promise<boolean> {
  try {
    const client = getOpenSearchClient();
    await client.update({
      index: OPENSEARCH_INDEX,
      id: productId,
      body: {
        doc: {
          stock: newStock,
          in_stock: newStock > 0,
        },
      },
      refresh: true,
    });
    console.log(`[OpenSearch] Updated product ${productId} stock to ${newStock} (in_stock: ${newStock > 0})`);
    return true;
  } catch (err: any) {
    console.warn(`[OpenSearch] Stock update skipped for product ${productId}:`, err.message);
    return false;
  }
}

export async function syncAllProductsFromDbToOpenSearch(): Promise<{ count: number; success: boolean }> {
  try {
    const res = await query(`
      SELECT 
        p.id, p.name, p.slug, p.description, p.brand, p.base_price, p.discount_percent,
        p.rating, p.review_count, p.created_at,
        c.name AS category, c.slug AS category_slug,
        COALESCE(pi.image_url, '') AS image_url,
        COALESCE(SUM(i.quantity), 0)::integer AS stock,
        COALESCE(w.city, 'Mumbai') AS warehouse_city
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
      LEFT JOIN inventory i ON p.id = i.product_id
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      WHERE p.is_active = TRUE
      GROUP BY p.id, c.name, c.slug, pi.image_url, w.city;
    `);

    let indexedCount = 0;
    for (const row of res.rows) {
      const finalPrice = Math.round(Number(row.base_price) * (1 - Number(row.discount_percent) / 100));
      const doc = {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        brand: row.brand,
        category: row.category,
        category_slug: row.category_slug,
        base_price: Number(row.base_price),
        discount_percent: Number(row.discount_percent),
        final_price: finalPrice,
        rating: Number(row.rating),
        review_count: Number(row.review_count),
        image_url: row.image_url,
        stock: Number(row.stock),
        in_stock: Number(row.stock) > 0,
        warehouse_city: row.warehouse_city,
        created_at: row.created_at,
      };

      const indexed = await indexProduct(doc);
      if (indexed) indexedCount++;
    }

    console.log(`[OpenSearch] Synced ${indexedCount} products from PostgreSQL to OpenSearch.`);
    return { count: indexedCount, success: true };
  } catch (err: any) {
    console.warn('[OpenSearch] Product sync skipped:', err.message);
    return { count: 0, success: false };
  }
}
