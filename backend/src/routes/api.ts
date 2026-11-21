import { Router } from 'express';
import { register, login, getProfile, updateProfile, forgotPassword } from '../controllers/authController.js';
import { getAddresses, addAddress, deleteAddress } from '../controllers/addressController.js';
import { getProducts, getProductBySlug, getCategories, search } from '../controllers/productController.js';
import { getCart, addToCart, updateCartItem, removeCartItem } from '../controllers/cartController.js';
import { getWishlist, addToWishlist, removeFromWishlist } from '../controllers/wishlistController.js';
import { createOrder, verifyPayment, getMyOrders, getOrderByNumber } from '../controllers/orderController.js';
import {
  getDashboardOverview,
  getAdminProducts,
  createAdminProduct,
  updateProductStock,
  getAdminOrders,
  updateOrderStatus,
  getNotificationLogs,
} from '../controllers/adminController.js';
import { verifyWhatsAppWebhook, handleWhatsAppWebhook, handleRazorpayWebhook } from '../controllers/webhookController.js';
import { getHealthStatus } from '../controllers/healthController.js';
import { authenticateToken, optionalAuthenticateToken, requireAdmin } from '../middlewares/auth.js';

const router = Router();

// --- Health ---
router.get('/health', getHealthStatus);

// --- Auth Routes ---
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authenticateToken, getProfile);
router.put('/auth/profile', authenticateToken, updateProfile);
router.post('/auth/forgot-password', forgotPassword);

// --- Address Routes ---
router.get('/addresses', authenticateToken, getAddresses);
router.post('/addresses', authenticateToken, addAddress);
router.delete('/addresses/:id', authenticateToken, deleteAddress);

// --- Catalogue & Search Routes ---
router.get('/products', getProducts);
router.get('/products/:slug', getProductBySlug);
router.get('/categories', getCategories);
router.get('/search', search);

// --- Cart Routes ---
router.get('/cart', optionalAuthenticateToken, getCart);
router.post('/cart/add', optionalAuthenticateToken, addToCart);
router.put('/cart/item/:id', optionalAuthenticateToken, updateCartItem);
router.delete('/cart/item/:id', optionalAuthenticateToken, removeCartItem);

// --- Wishlist Routes ---
router.get('/wishlist', authenticateToken, getWishlist);
router.post('/wishlist/add', authenticateToken, addToWishlist);
router.delete('/wishlist/:productId', authenticateToken, removeFromWishlist);

// --- Checkout & Orders Routes ---
router.post('/orders/create', authenticateToken, createOrder);
router.post('/orders/verify-payment', authenticateToken, verifyPayment);
router.get('/orders/my-orders', authenticateToken, getMyOrders);
router.get('/orders/:orderNumber', optionalAuthenticateToken, getOrderByNumber);

// --- Admin Dashboard Routes (Protected by Admin Role) ---
router.get('/admin/overview', authenticateToken, requireAdmin, getDashboardOverview);
router.get('/admin/products', authenticateToken, requireAdmin, getAdminProducts);
router.post('/admin/products', authenticateToken, requireAdmin, createAdminProduct);
router.put('/admin/products/:id/stock', authenticateToken, requireAdmin, updateProductStock);
router.get('/admin/orders', authenticateToken, requireAdmin, getAdminOrders);
router.put('/admin/orders/:id/status', authenticateToken, requireAdmin, updateOrderStatus);
router.get('/admin/notifications', authenticateToken, requireAdmin, getNotificationLogs);

// --- Webhooks ---
router.get('/webhooks/whatsapp', verifyWhatsAppWebhook);
router.post('/webhooks/whatsapp', handleWhatsAppWebhook);
router.post('/webhooks/razorpay', handleRazorpayWebhook);

export default router;
