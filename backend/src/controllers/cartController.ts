import { Request, Response } from 'express';
import { query, getClient } from '../database/db.js';

export async function getCart(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const sessionId = (req.headers['x-session-id'] as string) || 'guest-session';

    // Get or create cart
    let cartRes = userId
      ? await query(`SELECT id FROM carts WHERE user_id = $1`, [userId])
      : await query(`SELECT id FROM carts WHERE session_id = $1`, [sessionId]);

    if (cartRes.rows.length === 0) {
      cartRes = userId
        ? await query(`INSERT INTO carts (user_id) VALUES ($1) RETURNING id;`, [userId])
        : await query(`INSERT INTO carts (session_id) VALUES ($1) RETURNING id;`, [sessionId]);
    }

    const cartId = cartRes.rows[0].id;

    // Fetch items with live product price and current available stock
    const itemsRes = await query(`
      SELECT 
        ci.id as item_id,
        ci.quantity,
        p.id as product_id,
        p.name,
        p.slug,
        p.brand,
        p.base_price,
        p.discount_percent,
        ROUND((p.base_price * (1 - p.discount_percent / 100))::numeric, 2) AS unit_price,
        ROUND((p.base_price * (1 - p.discount_percent / 100) * ci.quantity)::numeric, 2) AS total_item_price,
        COALESCE(pi.image_url, '') as image_url,
        COALESCE(SUM(i.quantity), 0)::integer as available_stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE ci.cart_id = $1
      GROUP BY ci.id, ci.quantity, p.id, p.name, p.slug, p.brand, p.base_price, p.discount_percent, pi.image_url;
    `, [cartId]);

    let subtotal = 0;
    let totalDiscount = 0;

    itemsRes.rows.forEach((item: any) => {
      const baseTotal = Number(item.base_price) * item.quantity;
      const discountedTotal = Number(item.total_item_price);
      subtotal += baseTotal;
      totalDiscount += (baseTotal - discountedTotal);
    });

    // Indian E-Commerce Delivery Rules: Free delivery above ₹999, else ₹50
    const finalItemsTotal = subtotal - totalDiscount;
    const deliveryCharge = finalItemsTotal >= 999 || itemsRes.rows.length === 0 ? 0 : 50;
    const finalAmount = Math.max(0, finalItemsTotal + deliveryCharge);

    res.json({
      success: true,
      cart: {
        id: cartId,
        items: itemsRes.rows,
        itemCount: itemsRes.rows.reduce((sum: number, it: any) => sum + it.quantity, 0),
        subtotal: Math.round(subtotal),
        discount: Math.round(totalDiscount),
        deliveryCharge,
        freeDeliveryThreshold: 999,
        finalAmount: Math.round(finalAmount),
      },
    });
  } catch (err: any) {
    console.error('[Get Cart error]:', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve shopping cart' });
  }
}

export async function addToCart(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const sessionId = (req.headers['x-session-id'] as string) || 'guest-session';
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      res.status(400).json({ success: false, error: 'Product ID is required' });
      return;
    }

    // Verify stock from inventory
    const stockRes = await query(`
      SELECT COALESCE(SUM(quantity), 0)::integer as available_stock
      FROM inventory
      WHERE product_id = $1;
    `, [productId]);

    const availableStock = parseInt(stockRes.rows[0]?.available_stock || '0', 10);
    if (availableStock <= 0) {
      res.status(400).json({ success: false, error: 'Product is currently out of stock' });
      return;
    }

    // Get or create cart
    let cartRes = userId
      ? await query(`SELECT id FROM carts WHERE user_id = $1`, [userId])
      : await query(`SELECT id FROM carts WHERE session_id = $1`, [sessionId]);

    if (cartRes.rows.length === 0) {
      cartRes = userId
        ? await query(`INSERT INTO carts (user_id) VALUES ($1) RETURNING id;`, [userId])
        : await query(`INSERT INTO carts (session_id) VALUES ($1) RETURNING id;`, [sessionId]);
    }
    const cartId = cartRes.rows[0].id;

    // Check existing item
    const existing = await query(`
      SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2;
    `, [cartId, productId]);

    const currentQty = existing.rows[0]?.quantity || 0;
    const targetQty = currentQty + quantity;

    if (targetQty > availableStock) {
      res.status(400).json({
        success: false,
        error: `Cannot add more. Available stock is ${availableStock} (already in cart: ${currentQty}).`,
      });
      return;
    }

    if (existing.rows.length > 0) {
      await query(`
        UPDATE cart_items SET quantity = $1 WHERE id = $2;
      `, [targetQty, existing.rows[0].id]);
    } else {
      await query(`
        INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3);
      `, [cartId, productId, targetQty]);
    }

    res.json({ success: true, message: 'Item added to cart' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to add item to cart' });
  }
}

export async function updateCartItem(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
      await query(`DELETE FROM cart_items WHERE id = $1;`, [id]);
      res.json({ success: true, message: 'Item removed from cart' });
      return;
    }

    // Check stock limit
    const itemRes = await query(`
      SELECT ci.product_id, COALESCE(SUM(inv.quantity), 0)::integer as available_stock
      FROM cart_items ci
      LEFT JOIN inventory inv ON ci.product_id = inv.product_id
      WHERE ci.id = $1
      GROUP BY ci.product_id;
    `, [id]);

    if (itemRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Item not found in cart' });
      return;
    }

    const available = itemRes.rows[0].available_stock;
    if (quantity > available) {
      res.status(400).json({ success: false, error: `Requested quantity exceeds available stock (${available})` });
      return;
    }

    await query(`UPDATE cart_items SET quantity = $1 WHERE id = $2;`, [quantity, id]);
    res.json({ success: true, message: 'Cart updated' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update item quantity' });
  }
}

export async function removeCartItem(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await query(`DELETE FROM cart_items WHERE id = $1;`, [id]);
    res.json({ success: true, message: 'Item removed from cart' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to remove item' });
  }
}
