import { Request, Response } from 'express';
import { query, getClient } from '../database/db.js';
import { indexProduct, updateOpenSearchProductStock } from '../opensearch/indexManager.js';
import { insertOutboxEvent } from '../kafka/producer.js';
import { KAFKA_TOPICS } from '../kafka/client.js';
import { sendOrderStatusUpdateWhatsApp } from '../services/whatsappService.js';

export async function getDashboardOverview(req: Request, res: Response): Promise<void> {
  try {
    // 1. Revenue & Order Stats
    const statsRes = await query(`
      SELECT 
        COALESCE(SUM(total_amount), 0)::numeric as total_revenue,
        COUNT(id)::integer as total_orders,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END)::integer as pending_orders,
        COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END)::integer as confirmed_orders,
        COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END)::integer as delivered_orders
      FROM orders;
    `);

    // 2. Customer Count
    const customerCountRes = await query(`
      SELECT COUNT(u.id)::integer as total_customers
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name = 'CUSTOMER';
    `);

    // 3. Product & Low-Stock count (< 10 units)
    const productStatsRes = await query(`
      SELECT 
        COUNT(DISTINCT p.id)::integer as total_products,
        COUNT(DISTINCT CASE WHEN COALESCE(inv.qty, 0) < 10 THEN p.id END)::integer as low_stock_products
      FROM products p
      LEFT JOIN (
        SELECT product_id, SUM(quantity) as qty FROM inventory GROUP BY product_id
      ) inv ON p.id = inv.product_id
      WHERE p.is_active = TRUE;
    `);

    // 4. Recent Sales
    const recentOrdersRes = await query(`
      SELECT o.id, o.order_number, o.total_amount, o.status, o.payment_status, o.created_at, u.full_name as customer_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 6;
    `);

    // 5. Best-Selling Products
    const bestSellersRes = await query(`
      SELECT oi.product_name, SUM(oi.quantity)::integer as units_sold, SUM(oi.total_price)::numeric as revenue
      FROM order_items oi
      GROUP BY oi.product_name
      ORDER BY units_sold DESC
      LIMIT 5;
    `);

    res.json({
      success: true,
      metrics: {
        revenue: Math.round(Number(statsRes.rows[0].total_revenue)),
        totalOrders: statsRes.rows[0].total_orders,
        pendingOrders: statsRes.rows[0].pending_orders,
        confirmedOrders: statsRes.rows[0].confirmed_orders,
        deliveredOrders: statsRes.rows[0].delivered_orders,
        totalCustomers: customerCountRes.rows[0].total_customers,
        totalProducts: productStatsRes.rows[0].total_products,
        lowStockProducts: productStatsRes.rows[0].low_stock_products,
      },
      recentOrders: recentOrdersRes.rows,
      bestSellers: bestSellersRes.rows,
    });
  } catch (err: any) {
    console.error('[Admin Overview error]:', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve dashboard metrics' });
  }
}

export async function getAdminProducts(req: Request, res: Response): Promise<void> {
  try {
    const prodsRes = await query(`
      SELECT 
        p.id, p.name, p.slug, p.sku, p.brand, p.base_price, p.discount_percent,
        ROUND((p.base_price * (1 - p.discount_percent / 100))::numeric, 2) AS final_price,
        p.is_active, p.created_at,
        c.name as category_name,
        COALESCE(SUM(i.quantity), 0)::integer as stock,
        COALESCE(pi.image_url, '') as image_url
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
      GROUP BY p.id, c.name, pi.image_url
      ORDER BY p.created_at DESC;
    `);
    res.json({ success: true, products: prodsRes.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch admin products' });
  }
}

export async function createAdminProduct(req: Request, res: Response): Promise<void> {
  const { name, categoryId, brand, basePrice, discountPercent = 0, description, sku, initialStock = 20, imageUrl } = req.body;

  if (!name || !categoryId || !brand || !basePrice || !sku || !description) {
    res.status(400).json({ success: false, error: 'Missing required product parameters' });
    return;
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const prodRes = await client.query(`
      INSERT INTO products (name, slug, description, sku, category_id, brand, base_price, discount_percent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, slug, base_price, discount_percent;
    `, [name, slug, description, sku, categoryId, brand, basePrice, discountPercent]);

    const newProd = prodRes.rows[0];

    // Image
    if (imageUrl) {
      await client.query(`
        INSERT INTO product_images (product_id, image_url, is_primary)
        VALUES ($1, $2, TRUE);
      `, [newProd.id, imageUrl]);
    }

    // Default Warehouse Inventory
    const whRes = await client.query(`SELECT id FROM warehouses LIMIT 1`);
    const whId = whRes.rows[0]?.id || 1;

    await client.query(`
      INSERT INTO inventory (product_id, warehouse_id, quantity)
      VALUES ($1, $2, $3);
    `, [newProd.id, whId, initialStock]);

    await client.query('COMMIT');

    // Sync to OpenSearch
    await indexProduct({
      id: newProd.id,
      name,
      slug,
      description,
      brand,
      base_price: Number(basePrice),
      discount_percent: Number(discountPercent),
      final_price: Math.round(Number(basePrice) * (1 - Number(discountPercent) / 100)),
      rating: 5.0,
      review_count: 0,
      image_url: imageUrl || '',
      stock: initialStock,
      in_stock: initialStock > 0,
    });

    res.status(201).json({ success: true, product: newProd });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message || 'Product creation failed' });
  } finally {
    client.release();
  }
}

export async function updateProductStock(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const { stock } = req.body;

  if (stock === undefined || stock < 0) {
    res.status(400).json({ success: false, error: 'Valid stock integer >= 0 is required' });
    return;
  }

  try {
    const whRes = await query(`SELECT id FROM warehouses LIMIT 1`);
    const whId = whRes.rows[0]?.id || 1;

    await query(`
      INSERT INTO inventory (product_id, warehouse_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (product_id, warehouse_id) DO UPDATE SET quantity = EXCLUDED.quantity;
    `, [id, whId, stock]);

    // Update OpenSearch stock document
    await updateOpenSearchProductStock(id, stock);

    res.json({ success: true, message: `Stock updated to ${stock}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update stock' });
  }
}

export async function getAdminOrders(req: Request, res: Response): Promise<void> {
  try {
    const ordersRes = await query(`
      SELECT 
        o.id, o.order_number, o.user_id, o.status, o.total_amount, o.payment_status,
        o.shipping_snapshot, o.created_at,
        u.email as customer_email, u.full_name as customer_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC;
    `);
    res.json({ success: true, orders: ordersRes.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve admin orders' });
  }
}

export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const { status, notes, location = 'Fulfillment Center' } = req.body;

  const validStatuses = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const updateRes = await client.query(`
      UPDATE orders
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, order_number, user_id, shipping_snapshot;
    `, [status, id]);

    if (updateRes.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    const order = updateRes.rows[0];

    // Update Shipment
    const shipRes = await client.query(`
      UPDATE shipments
      SET current_status = $1, updated_at = NOW()
      WHERE order_id = $2
      RETURNING id;
    `, [status, id]);

    if (shipRes.rows.length > 0) {
      await client.query(`
        INSERT INTO tracking_events (shipment_id, status, location, notes)
        VALUES ($1, $2, $3, $4);
      `, [shipRes.rows[0].id, status, location, notes || `Status updated to ${status}`]);
    }

    // Publish Kafka Outbox Event
    await insertOutboxEvent(
      client,
      'ORDER',
      id,
      'ORDER_STATUS_CHANGED',
      KAFKA_TOPICS.ORDER_STATUS_UPDATED,
      { orderId: id, orderNumber: order.order_number, newStatus: status }
    );

    await client.query('COMMIT');

    // Trigger WhatsApp notification for order tracking milestone
    const customerPhone = order.shipping_snapshot?.phone || '+919820012345';
    await sendOrderStatusUpdateWhatsApp(order.order_number, status, customerPhone, order.user_id);

    res.json({ success: true, message: `Order #${order.order_number} status updated to ${status}` });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: 'Failed to update order status' });
  } finally {
    client.release();
  }
}

export async function getNotificationLogs(req: Request, res: Response): Promise<void> {
  try {
    const logsRes = await query(`
      SELECT * FROM notification_logs ORDER BY created_at DESC LIMIT 50;
    `);
    res.json({ success: true, logs: logsRes.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch notification logs' });
  }
}
