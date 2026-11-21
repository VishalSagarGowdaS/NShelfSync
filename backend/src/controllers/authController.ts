import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query, getClient } from '../database/db.js';
import { env } from '../config/env.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function register(req: Request, res: Response): Promise<void> {
  const parseResult = registerSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
    return;
  }

  const { email, password, fullName, phone } = parseResult.data;

  try {
    const existing = await query(`SELECT id FROM users WHERE email = $1`, [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      res.status(409).json({ success: false, error: 'Account with this email already exists' });
      return;
    }

    const roleRes = await query(`SELECT id FROM roles WHERE name = 'CUSTOMER'`);
    const roleId = roleRes.rows[0]?.id || 1;

    const passwordHash = await bcrypt.hash(password, 10);
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const userRes = await client.query(`
        INSERT INTO users (email, password_hash, full_name, phone, role_id, is_email_verified)
        VALUES ($1, $2, $3, $4, $5, TRUE)
        RETURNING id, email, full_name, phone, created_at;
      `, [email.toLowerCase(), passwordHash, fullName, phone || null, roleId]);

      const newUser = userRes.rows[0];

      // Create Cart & Wishlist for customer
      await client.query(`INSERT INTO carts (user_id) VALUES ($1);`, [newUser.id]);
      await client.query(`INSERT INTO wishlists (user_id) VALUES ($1);`, [newUser.id]);

      await client.query('COMMIT');

      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, fullName: newUser.full_name, role: 'CUSTOMER' },
        env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.full_name,
          phone: newUser.phone,
          role: 'CUSTOMER',
        },
      });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('[Auth register error]:', err.message);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, error: 'Invalid email or password format' });
    return;
  }

  const { email, password } = parseResult.data;

  try {
    const userRes = await query(`
      SELECT u.id, u.email, u.password_hash, u.full_name, u.phone, r.name as role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1;
    `, [email.toLowerCase()]);

    if (userRes.rows.length === 0) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const user = userRes.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, fullName: user.full_name, role: user.role_name },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        role: user.role_name,
      },
    });
  } catch (err: any) {
    console.error('[Auth login error]:', err.message);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const userRes = await query(`
      SELECT u.id, u.email, u.full_name, u.phone, r.name as role, u.created_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1;
    `, [userId]);

    if (userRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const addressesRes = await query(`
      SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC;
    `, [userId]);

    res.json({
      success: true,
      user: userRes.rows[0],
      addresses: addressesRes.rows,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve profile' });
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { fullName, phone } = req.body;

    const updated = await query(`
      UPDATE users
      SET full_name = COALESCE($1, full_name),
          phone = COALESCE($2, phone),
          updated_at = NOW()
      WHERE id = $3
      RETURNING id, email, full_name, phone;
    `, [fullName, phone, userId]);

    res.json({ success: true, user: updated.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Profile update failed' });
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, error: 'Email is required' });
    return;
  }

  // Issue simulated secure reset token
  res.json({
    success: true,
    message: 'If an account exists with this email, password reset instructions have been dispatched.',
  });
}
