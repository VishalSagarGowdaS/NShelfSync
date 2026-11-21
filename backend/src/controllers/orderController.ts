import { Request, Response } from 'express';
import crypto from 'crypto';
import { query, getClient } from '../database/db.js';
import { createRazorpayOrder, verifyPaymentSignature } from '../services/paymentService.js';
import { insertOutboxEvent } from '../kafka/producer.js';
import { KAFKA_TOPICS } from '../kafka/client.js';

export async function createOrder(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { shippingAddress, paymentMethod = 'RAZORPAY', items: customItems } = req.body;

  // Validate shipping details
  if (!shippingAddress || !shippingAddress.recipientName || !shippingAddress.phone || !shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.postalCode) {
    res.status(400).json({ success: false, error: 'Complete shipping address (Name, Phone, Address, City, State, PIN) is required' });
    return;
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Determine checkout items: from cart or direct array
    let orderItemsToProcess: Array<{ productId: string; quantity: number }> = [];

    if (customItems && Array.isArray(customItems) && customItems.length > 0) {
      orderItemsToProcess = customItems;
    } else {
      const cartRes = await client.query(`SELECT id FROM carts WHERE user_id = $1`, [userId]);
      if (cartRes.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(400).json({ success: false, error: 'Shopping cart is empty' });
        return;
      }
      const cartId = cartRes.rows[0].id;
      const cartItemsRes = await client.query(`
        SELECT product_id, quantity FROM cart_items WHERE cart_id = $1;
      `, [cartId]);

      if (cartItemsRes.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(400).json({ success: false, error: 'Shopping cart is empty' });
        return;
      }
      orderItemsToProcess = cartItemsRes.rows.map((r: any) => ({
        productId: r.product_id,
        quantity: r.quantity,
      }));
    }

    let subtotal = 0;
    let totalDiscount = 0;
    const finalItems: any[] = [];

    // Safe Atomic Inventory Reservation to prevent overselling
    for (const item of orderItemsToProcess) {
      // 1. Fetch live product price & active state
      const prodRes = await client.query(`
        SELECT id, name, slug, base_price, discount_percent, is_active
        FROM products
        WHERE id = $1 AND is_active = TRUE
        FOR UPDATE;
      `, [item.productId]);

      if (prodRes.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(400).json({ success: false, error: `Product not found or inactive: ${item.productId}` });
        return;
      }

      const prod = prodRes.rows[0];
      const basePrice = Number(prod.base_price);
      const discountPercent = Number(prod.discount_percent);
      const unitPrice = Math.round(basePrice * (1 - discountPercent / 100));
      const lineItemTotal = unitPrice * item.quantity;

      subtotal += basePrice * item.quantity;
      totalDiscount += (basePrice * item.quantity) - lineItemTotal;

      // 2. ATOMIC STOCK RESERVATION
      // Locks the inventory row and atomically verifies stock >= requested qty
      const invUpdateRes = await client.query(`
        UPDATE inventory
        SET quantity = quantity - $1,
            reserved_quantity = reserved_quantity + $1,
            updated_at = NOW()
        WHERE product_id = $2 AND quantity >= $1
        RETURNING quantity, warehouse_id;
      `, [item.quantity, item.productId]);

      if (invUpdateRes.rowCount === 0) {
        await client.query('ROLLBACK');
        res.status(409).json({
          success: false,
          errorCode: 'OUT_OF_STOCK',
          error: `Insufficient stock for product: "${prod.name}". Another customer may have just placed an order.`,
        });
        return;
      }

      const remainingStock = invUpdateRes.rows[0].quantity;

      finalItems.push({
        productId: prod.id,
        name: prod.name,
        slug: prod.slug,
        unitPrice,
        quantity: item.quantity,
        totalPrice: lineItemTotal,
        remainingStock,
      });
    }

    // Calculations
    const finalItemsTotal = subtotal - totalDiscount;
    const deliveryCharge = finalItemsTotal >= 999 ? 0 : 50;
    const totalAmount = Math.max(0, finalItemsTotal + deliveryCharge);
    const orderNumber = `SS${Date.now().toString().slice(-6)}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    // Insert Order
    const isCod = paymentMethod === 'COD';
    const initialStatus = isCod ? 'CONFIRMED' : 'PENDING';
    const initialPaymentStatus = isCod ? 'PENDING' : 'PENDING';

    const orderRes = await client.query(`
      INSERT INTO orders (
        order_number, user_id, status, subtotal, discount, delivery_charge,
        total_amount, payment_status, shipping_snapshot
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, order_number, total_amount, created_at;
    `, [
      orderNumber,
      userId,
      initialStatus,
      subtotal,
      totalDiscount,
      deliveryCharge,
      totalAmount,
      initialPaymentStatus,
      JSON.stringify(shippingAddress),
    ]);

    const createdOrder = orderRes.rows[0];
    const orderId = createdOrder.id;

    // Insert Order Items
    for (const it of finalItems) {
      await client.query(`
        INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, total_price)
        VALUES ($1, $2, $3, $4, $5, $6);
      `, [orderId, it.productId, it.name, it.unitPrice, it.quantity, it.totalPrice]);
    }

    // Create Initial Shipment Tracking Record
    const trackingNumber = `TRK${orderNumber}`;
    const shipmentRes = await client.query(`
      INSERT INTO shipments (order_id, tracking_number, carrier, current_status, estimated_delivery)
      VALUES ($1, $2, 'ShelfSync Express', 'ORDER_PLACED', NOW() + INTERVAL '3 days')
      RETURNING id;
    `, [orderId, trackingNumber]);

    await client.query(`
      INSERT INTO tracking_events (shipment_id, status, location, notes)
      VALUES ($1, 'ORDER_PLACED', $2, 'Order received and inventory reserved.');
    `, [shipmentRes.rows[0].id, shippingAddress.city]);

    // Clear Customer Cart
    const userCart = await client.query(`SELECT id FROM carts WHERE user_id = $1`, [userId]);
    if (userCart.rows.length > 0) {
      await client.query(`DELETE FROM cart_items WHERE cart_id = $1;`, [userCart.rows[0].id]);
    }

    // Record Transactional Outbox Event for Kafka order-placed
    await insertOutboxEvent(
      client,
      'ORDER',
      orderId,
      'ORDER_CREATED',
      KAFKA_TOPICS.ORDER_PLACED,
      {
        orderId,
        orderNumber,
        userId,
        totalAmount,
        paymentMethod,
        items: finalItems,
      }
    );

    // Record Inventory Updated events for Kafka -> OpenSearch sync
    for (const it of finalItems) {
      await insertOutboxEvent(
        client,
        'INVENTORY',
        it.productId,
        'STOCK_DECREMENTED',
        KAFKA_TOPICS.INVENTORY_UPDATED,
        {
          productId: it.productId,
          newStock: it.remainingStock,
        }
      );
    }

    await client.query('COMMIT');

    // Handle Payment Gateway Order creation
    let paymentData: any = null;
    if (!isCod) {
      paymentData = await createRazorpayOrder(orderId, orderNumber, totalAmount);
    }

    res.status(201).json({
      success: true,
      order: {
        id: orderId,
        orderNumber,
        totalAmount,
        status: initialStatus,
        paymentStatus: initialPaymentStatus,
        paymentMethod,
      },
      payment: paymentData,
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('[Create Order error]:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Order creation failed' });
  } finally {
    client.release();
  }
}

export async function verifyPayment(req: Request, res: Response): Promise<void> {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    res.status(400).json({ success: false, error: 'Complete Razorpay payment credentials required for verification' });
    return;
  }

  try {
    const result = await verifyPaymentSignature({
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (result.verified) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, error: result.message });
    }
  } catch (err: any) {
    console.error('[Verify Payment error]:', err.message);
    res.status(500).json({ success: false, error: 'Payment verification failed' });
  }
}

export async function getMyOrders(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const ordersRes = await query(`
      SELECT 
        o.id, o.order_number, o.status, o.total_amount, o.payment_status,
        o.delivery_charge, o.created_at,
        s.tracking_number, s.carrier, s.current_status as shipment_status
      FROM orders o
      LEFT JOIN shipments s ON o.id = s.order_id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC;
    `, [userId]);

    res.json({ success: true, orders: ordersRes.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve orders' });
  }
}

export async function getOrderByNumber(req: Request, res: Response): Promise<void> {
  try {
    const { orderNumber } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'ADMIN';

    const orderRes = await query(`
      SELECT 
        o.id, o.order_number, o.user_id, o.status, o.subtotal, o.discount,
        o.delivery_charge, o.total_amount, o.payment_status, o.shipping_snapshot, o.created_at,
        p.payment_method, p.gateway_provider, p.razorpay_payment_id
      FROM orders o
      LEFT JOIN payments p ON o.id = p.order_id
      WHERE o.order_number = $1;
    `, [orderNumber]);

    if (orderRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    const order = orderRes.rows[0];

    // Customer protection: only owner or admin can view
    if (userId && order.user_id !== userId && !isAdmin) {
      res.status(403).json({ success: false, error: 'Unauthorized to view this order' });
      return;
    }

    // Fetch order items
    const itemsRes = await query(`
      SELECT oi.*, p.slug, COALESCE(pi.image_url, '') as image_url
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
      WHERE oi.order_id = $1;
    `, [order.id]);

    // Fetch shipment & tracking events
    const shipmentRes = await query(`
      SELECT s.*, json_agg(
        json_build_object(
          'id', te.id,
          'status', te.status,
          'location', te.location,
          'notes', te.notes,
          'timestamp', te.timestamp
        ) ORDER BY te.timestamp ASC
      ) as timeline
      FROM shipments s
      LEFT JOIN tracking_events te ON s.id = te.shipment_id
      WHERE s.order_id = $1
      GROUP BY s.id;
    `, [order.id]);

    res.json({
      success: true,
      order: {
        ...order,
        items: itemsRes.rows,
        shipment: shipmentRes.rows[0] || null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve order' });
  }
}
