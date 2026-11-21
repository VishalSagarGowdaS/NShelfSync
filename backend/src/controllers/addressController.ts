import { Request, Response } from 'express';
import { query } from '../database/db.js';

export async function getAddresses(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const resAddresses = await query(`
      SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC;
    `, [userId]);
    res.json({ success: true, addresses: resAddresses.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve addresses' });
  }
}

export async function addAddress(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { recipientName, phone, addressLine1, addressLine2, city, state, postalCode, isDefault } = req.body;

    if (!recipientName || !phone || !addressLine1 || !city || !state || !postalCode) {
      res.status(400).json({ success: false, error: 'All primary address fields are required' });
      return;
    }

    if (isDefault) {
      await query(`UPDATE addresses SET is_default = FALSE WHERE user_id = $1;`, [userId]);
    }

    const inserted = await query(`
      INSERT INTO addresses (user_id, recipient_name, phone, address_line1, address_line2, city, state, postal_code, is_default)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `, [userId, recipientName, phone, addressLine1, addressLine2 || null, city, state, postalCode, Boolean(isDefault)]);

    res.status(201).json({ success: true, address: inserted.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to save address' });
  }
}

export async function deleteAddress(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const addressId = req.params.id;

    await query(`DELETE FROM addresses WHERE id = $1 AND user_id = $2;`, [addressId, userId]);
    res.json({ success: true, message: 'Address removed successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to remove address' });
  }
}
