import bcrypt from 'bcryptjs';
import { getDbPool, testDbConnection } from './db.js';

export interface SeedProduct {
  name: string;
  slug: string;
  category: string;
  brand: string;
  base_price: number;
  discount_percent: number;
  rating: number;
  review_count: number;
  description: string;
  sku: string;
  imageUrl: string;
  stock: number;
  warehouseCity: string;
}

export const SEED_CATEGORIES = [
  { name: 'Electronics', slug: 'electronics', description: 'Smartphones, Laptops, Audio, Wearables & Gadgets', image_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600' },
  { name: 'Fashion', slug: 'fashion', description: 'Men, Women, Ethnic, Footwear & Accessories', image_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600' },
  { name: 'Home & Kitchen', slug: 'home-kitchen', description: 'Cookware, Appliances, Decor & Furnishing', image_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600' },
  { name: 'Grocery', slug: 'grocery', description: 'Daily Staples, Organic Foods, Beverages & Snacks', image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600' },
  { name: 'Beauty & Personal Care', slug: 'beauty-personal-care', description: 'Skincare, Haircare, Fragrances & Wellness', image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600' },
  { name: 'Sports & Fitness', slug: 'sports-fitness', description: 'Fitness Gear, Shoes, Yoga, Nutrition & Outdoor', image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600' },
];

export const SEED_WAREHOUSES = [
  { code: 'WH-MUM-01', name: 'Bhiwandi Central Fulfillment Hub', city: 'Mumbai', state: 'Maharashtra', postal_code: '421302' },
  { code: 'WH-DEL-01', name: 'Gurugram North Logistics Center', city: 'Delhi NCR', state: 'Haryana', postal_code: '122001' },
  { code: 'WH-BLR-01', name: 'Whitefield South Express Depot', city: 'Bengaluru', state: 'Karnataka', postal_code: '560066' },
  { code: 'WH-HYD-01', name: 'Shamshabad Deccan Hub', city: 'Hyderabad', state: 'Telangana', postal_code: '500409' },
];

export const SEED_PRODUCTS: SeedProduct[] = [
  // Electronics
  {
    name: 'boAt Rockerz 450 Bluetooth On-Ear Headphones',
    slug: 'boat-rockerz-450-bluetooth-headphones',
    category: 'electronics',
    brand: 'boAt',
    base_price: 1499,
    discount_percent: 25,
    rating: 4.4,
    review_count: 8520,
    description: 'Up to 15 hours playtime, 40mm dynamic drivers, padded ear cushions and integrated mic for crystal-clear calling.',
    sku: 'ELEC-BOAT-450-01',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700',
    stock: 50,
    warehouseCity: 'Mumbai'
  },
  {
    name: 'Noise ColorFit Pulse 3 Smart Watch with BT Calling',
    slug: 'noise-colorfit-pulse-3-smartwatch',
    category: 'electronics',
    brand: 'Noise',
    base_price: 1999,
    discount_percent: 30,
    rating: 4.2,
    review_count: 4210,
    description: '1.96-inch TFT display, Tru Sync Bluetooth calling, 100+ sports modes, 7 days battery and IP68 water resistance.',
    sku: 'ELEC-NOISE-PULSE3',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700',
    stock: 45,
    warehouseCity: 'Bengaluru'
  },
  {
    name: 'OnePlus Nord Buds 2 True Wireless Earbuds',
    slug: 'oneplus-nord-buds-2-tws',
    category: 'electronics',
    brand: 'OnePlus',
    base_price: 2999,
    discount_percent: 15,
    rating: 4.5,
    review_count: 6730,
    description: 'Active Noise Cancellation (ANC), 12.4mm dynamic titanium drivers, BassWave enhancement, and up to 36 hours total playback.',
    sku: 'ELEC-1PLUS-NB2',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=700',
    stock: 35,
    warehouseCity: 'Delhi NCR'
  },
  {
    name: 'Realme 10,000mAh 22.5W Fast Charging Power Bank',
    slug: 'realme-10000mah-fast-charge-powerbank',
    category: 'electronics',
    brand: 'Realme',
    base_price: 1299,
    discount_percent: 10,
    rating: 4.3,
    review_count: 3100,
    description: 'Dual output ports (USB-A & Type-C), two-way fast charging, 14 layers of circuit protection, slim carbon fiber texture design.',
    sku: 'ELEC-RLM-PB10K',
    imageUrl: 'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=700',
    stock: 60,
    warehouseCity: 'Hyderabad'
  },
  {
    name: 'ASUS Vivobook 15 Intel Core i5 12th Gen Laptop',
    slug: 'asus-vivobook-15-intel-i5-12th-gen',
    category: 'electronics',
    brand: 'ASUS',
    base_price: 49999,
    discount_percent: 12,
    rating: 4.6,
    review_count: 1420,
    description: '15.6-inch FHD anti-glare display, 16GB DDR4 RAM, 512GB PCIe 4.0 SSD, Windows 11 Home, fingerprint sensor, lightweight at 1.7kg.',
    sku: 'ELEC-ASUS-VB15-I5',
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=700',
    stock: 15,
    warehouseCity: 'Bengaluru'
  },

  // Fashion
  {
    name: 'FabIndia Pure Cotton Block Printed Kurta',
    slug: 'fabindia-cotton-block-print-kurta',
    category: 'fashion',
    brand: 'FabIndia',
    base_price: 1890,
    discount_percent: 20,
    rating: 4.7,
    review_count: 890,
    description: 'Authentic hand-block printed straight kurta tailored from breathable 100% fine cotton. Mandarin collar with mother-of-pearl buttons.',
    sku: 'FASH-FAB-KURTA-01',
    imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=700',
    stock: 40,
    warehouseCity: 'Delhi NCR'
  },
  {
    name: 'Levi\'s Men\'s 511 Slim Fit Stretchable Jeans',
    slug: 'levis-mens-511-slim-fit-jeans',
    category: 'fashion',
    brand: 'Levi\'s',
    base_price: 3199,
    discount_percent: 30,
    rating: 4.5,
    review_count: 3450,
    description: 'Classic 5-pocket styling with added stretch for all-day comfort. Sits below the waist with a slim leg from hip to ankle.',
    sku: 'FASH-LEVI-511-DENIM',
    imageUrl: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=700',
    stock: 30,
    warehouseCity: 'Mumbai'
  },
  {
    name: 'W for Woman Floral A-Line Festive Dress',
    slug: 'w-for-woman-floral-aline-dress',
    category: 'fashion',
    brand: 'W for Woman',
    base_price: 2499,
    discount_percent: 35,
    rating: 4.3,
    review_count: 560,
    description: 'Contemporary Indo-western floral midi dress with flared hemline, delicate gold foil detailing and belted tie-up waist.',
    sku: 'FASH-W-FLORAL-DRESS',
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=700',
    stock: 25,
    warehouseCity: 'Bengaluru'
  },
  {
    name: 'Red Tape Men\'s Classic Leather Formal Shoes',
    slug: 'red-tape-mens-classic-leather-shoes',
    category: 'fashion',
    brand: 'Red Tape',
    base_price: 2199,
    discount_percent: 45,
    rating: 4.2,
    review_count: 1820,
    description: 'Handcrafted genuine leather lace-up derby shoes with cushioned insoles and slip-resistant TPR sole for executive styling.',
    sku: 'FASH-REDT-LEATHER-SHOE',
    imageUrl: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=700',
    stock: 35,
    warehouseCity: 'Hyderabad'
  },

  // Home & Kitchen
  {
    name: 'Prestige Iris 750W Mixer Grinder with 4 Jars',
    slug: 'prestige-iris-750w-mixer-grinder',
    category: 'home-kitchen',
    brand: 'Prestige',
    base_price: 3495,
    discount_percent: 28,
    rating: 4.4,
    review_count: 5120,
    description: 'Heavy duty 750-watt copper winding motor, 3 stainless steel grinding jars plus 1 transparent juicer jar with safety lock mechanism.',
    sku: 'HOME-PREST-IRIS750',
    imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=700',
    stock: 28,
    warehouseCity: 'Mumbai'
  },
  {
    name: 'Pigeon Stainless Steel 3-Litre Outer Lid Pressure Cooker',
    slug: 'pigeon-3l-stainless-steel-pressure-cooker',
    category: 'home-kitchen',
    brand: 'Pigeon',
    base_price: 1399,
    discount_percent: 20,
    rating: 4.3,
    review_count: 4200,
    description: 'Food-grade stainless steel body with sandwich induction bottom for uniform heating, durable gasket release system, ergonomic handle.',
    sku: 'HOME-PIG-COOKER-3L',
    imageUrl: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=700',
    stock: 45,
    warehouseCity: 'Delhi NCR'
  },
  {
    name: 'Milton Thermosteel Flip Lid 1000ml Insulated Flask',
    slug: 'milton-thermosteel-flip-lid-1000ml',
    category: 'home-kitchen',
    brand: 'Milton',
    base_price: 999,
    discount_percent: 15,
    rating: 4.6,
    review_count: 6700,
    description: 'Double-walled vacuum insulated flask keeps beverages hot or cold for up to 24 hours. 100% rust-proof 304 stainless steel.',
    sku: 'HOME-MILT-FLASK-1L',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=700',
    stock: 55,
    warehouseCity: 'Bengaluru'
  },
  {
    name: 'Wonderchef Royal Velvet Non-Stick Induction Cookware Set',
    slug: 'wonderchef-royal-velvet-nonstick-set',
    category: 'home-kitchen',
    brand: 'Wonderchef',
    base_price: 2799,
    discount_percent: 32,
    rating: 4.5,
    review_count: 2310,
    description: '5-layer meta-tuff non-stick coating, includes 24cm Dosa Tawa, 24cm Frying Pan, 24cm Kadhai with glass lid. 100% PFOA free.',
    sku: 'HOME-WOND-VELVET-SET',
    imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=700',
    stock: 22,
    warehouseCity: 'Hyderabad'
  },

  // Grocery
  {
    name: 'Fortune Sunlite Refined Sunflower Oil (5 Litre Can)',
    slug: 'fortune-sunlite-sunflower-oil-5l',
    category: 'grocery',
    brand: 'Fortune',
    base_price: 749,
    discount_percent: 8,
    rating: 4.6,
    review_count: 9800,
    description: 'Enriched with Vitamin A and D, light and easy to digest refined sunflower cooking oil for everyday family health.',
    sku: 'GROC-FORT-OIL-5L',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=700',
    stock: 75,
    warehouseCity: 'Mumbai'
  },
  {
    name: 'India Gate Basmati Rice Feast Rozzana (5 kg Bag)',
    slug: 'india-gate-basmati-rice-rozzana-5kg',
    category: 'grocery',
    brand: 'India Gate',
    base_price: 499,
    discount_percent: 12,
    rating: 4.5,
    review_count: 11200,
    description: 'Aged fragrant basmati grains with slender texture and delicious aroma, ideal for everyday biryani, pulao, and steamed rice.',
    sku: 'GROC-IG-RICE-5KG',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=700',
    stock: 80,
    warehouseCity: 'Delhi NCR'
  },
  {
    name: 'Tata Tea Gold Leaf Tea with Gentle Pressed Long Leaves (1 kg)',
    slug: 'tata-tea-gold-leaf-1kg',
    category: 'grocery',
    brand: 'Tata Tea',
    base_price: 580,
    discount_percent: 10,
    rating: 4.7,
    review_count: 8400,
    description: 'Rich blend of fine Assam CTC tea leaves with 15% gently pressed long tea leaves for full-bodied flavor and irresistible aroma.',
    sku: 'GROC-TATA-GOLD-1KG',
    imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=700',
    stock: 90,
    warehouseCity: 'Bengaluru'
  },
  {
    name: 'Kellogg\'s Real Almond and Honey Crunchy Muesli (1 kg)',
    slug: 'kelloggs-almond-honey-muesli-1kg',
    category: 'grocery',
    brand: 'Kellogg\'s',
    base_price: 649,
    discount_percent: 15,
    rating: 4.5,
    review_count: 3800,
    description: 'Nutritious breakfast blend made from multigrain oats, wheat flakes, crunchy Californian almonds, and natural honey.',
    sku: 'GROC-KELL-MUESLI-1KG',
    imageUrl: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=700',
    stock: 50,
    warehouseCity: 'Hyderabad'
  },

  // Beauty & Personal Care
  {
    name: 'Mamaearth Onion Hair Oil with Redensyl for Hair Fall Control (250ml)',
    slug: 'mamaearth-onion-hair-oil-250ml',
    category: 'beauty-personal-care',
    brand: 'Mamaearth',
    base_price: 599,
    discount_percent: 18,
    rating: 4.3,
    review_count: 6500,
    description: 'Formulated with onion seed oil and Redensyl to nourish hair follicles, reduce hair thinning, and add shine. Dermatologically tested.',
    sku: 'BEAUT-MAMA-ONION-OIL',
    imageUrl: 'https://images.unsplash.com/photo-1608248597359-52e858dbf411?w=700',
    stock: 65,
    warehouseCity: 'Mumbai'
  },
  {
    name: 'Minimalist 10% Niacinamide Face Serum with Zinc (30ml)',
    slug: 'minimalist-niacinamide-10-serum-30ml',
    category: 'beauty-personal-care',
    brand: 'Minimalist',
    base_price: 599,
    discount_percent: 10,
    rating: 4.6,
    review_count: 7890,
    description: 'Pure 10% Niacinamide with Zinc PCA to balance sebum production, fade acne marks, and strengthen the epidermal moisture barrier.',
    sku: 'BEAUT-MIN-NIACIN-30ML',
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=700',
    stock: 45,
    warehouseCity: 'Bengaluru'
  },
  {
    name: 'Biotique Bio Kelp Protein Shampoo for Falling Hair (650ml)',
    slug: 'biotique-bio-kelp-shampoo-650ml',
    category: 'beauty-personal-care',
    brand: 'Biotique',
    base_price: 490,
    discount_percent: 25,
    rating: 4.2,
    review_count: 4120,
    description: '100% Ayurvedic recipe of pure kelp, natural proteins, peppermint oil and mint extract for invigorated hair and scalp growth.',
    sku: 'BEAUT-BIO-KELP-650ML',
    imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=700',
    stock: 55,
    warehouseCity: 'Delhi NCR'
  },
  {
    name: 'Nivea Soft Light Moisturizing Cream with Vitamin E (300ml)',
    slug: 'nivea-soft-light-moisturizer-300ml',
    category: 'beauty-personal-care',
    brand: 'Nivea',
    base_price: 449,
    discount_percent: 22,
    rating: 4.6,
    review_count: 8200,
    description: 'Fast-absorbing non-greasy moisturizing formula infused with Jojoba oil and Vitamin E for deeply refreshed, supple skin.',
    sku: 'BEAUT-NIV-SOFT-300ML',
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=700',
    stock: 70,
    warehouseCity: 'Hyderabad'
  },

  // Sports & Fitness
  {
    name: 'Boldfit Pro Yoga Mat 6mm with Alignment Lines and Carry Strap',
    slug: 'boldfit-pro-yoga-mat-6mm',
    category: 'sports-fitness',
    brand: 'Boldfit',
    base_price: 1199,
    discount_percent: 30,
    rating: 4.5,
    review_count: 3600,
    description: 'Eco-friendly TPE material with anti-tear mesh, dual-sided non-slip texture and body alignment guide marks for home workouts.',
    sku: 'SPORT-BOLD-YOGA-6MM',
    imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=700',
    stock: 40,
    warehouseCity: 'Bengaluru'
  },
  {
    name: 'Nivia Storm Football Rubber Moulded Size 5',
    slug: 'nivia-storm-football-size-5',
    category: 'sports-fitness',
    brand: 'Nivia',
    base_price: 649,
    discount_percent: 20,
    rating: 4.4,
    review_count: 2890,
    description: '32-panel rubber moulded training football with reinforced butyl bladder for optimal air retention on turf and hard ground.',
    sku: 'SPORT-NIV-BALL-SZ5',
    imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=700',
    stock: 35,
    warehouseCity: 'Delhi NCR'
  },
  {
    name: 'Optimum Nutrition (ON) Gold Standard 100% Whey Protein (1 kg, Double Rich Chocolate)',
    slug: 'on-gold-standard-whey-protein-1kg',
    category: 'sports-fitness',
    brand: 'Optimum Nutrition',
    base_price: 3699,
    discount_percent: 15,
    rating: 4.7,
    review_count: 9400,
    description: '24g of high quality whey protein isolate per serving with 5.5g of naturally occurring BCAAs and 4g of glutamine for muscle recovery.',
    sku: 'SPORT-ON-WHEY-1KG',
    imageUrl: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=700',
    stock: 25,
    warehouseCity: 'Mumbai'
  },
  {
    name: 'Cockatoo Rubber Coated Hex Dumbbells Pair (5kg x 2)',
    slug: 'cockatoo-rubber-hex-dumbbells-5kg-pair',
    category: 'sports-fitness',
    brand: 'Cockatoo',
    base_price: 2499,
    discount_percent: 35,
    rating: 4.5,
    review_count: 1750,
    description: 'Solid cast iron with durable virgin rubber hexagonal heads that prevent rolling. Contoured chrome-plated ergonomic grip handles.',
    sku: 'SPORT-COCK-DUMB-5KG',
    imageUrl: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=700',
    stock: 30,
    warehouseCity: 'Hyderabad'
  }
];

export async function seedDatabase(): Promise<{ success: boolean; message: string }> {
  console.log('[Seed] Verifying database connection...');
  const conn = await testDbConnection();
  if (!conn.connected) {
    const msg = `Cannot seed database: PostgreSQL is not connected (${conn.error}). Please configure DATABASE_URL in .env.`;
    console.warn(`[Seed] ${msg}`);
    return { success: false, message: msg };
  }

  const pool = getDbPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Seed Roles
    console.log('[Seed] Seeding Roles...');
    await client.query(`
      INSERT INTO roles (name, description) VALUES
      ('CUSTOMER', 'Standard customer account with shopping privileges'),
      ('ADMIN', 'Platform administrator with inventory and order management')
      ON CONFLICT (name) DO NOTHING;
    `);

    const customerRoleRes = await client.query(`SELECT id FROM roles WHERE name = 'CUSTOMER'`);
    const adminRoleRes = await client.query(`SELECT id FROM roles WHERE name = 'ADMIN'`);
    const customerRoleId = customerRoleRes.rows[0].id;
    const adminRoleId = adminRoleRes.rows[0].id;

    // 2. Seed Admin & Customer Users
    console.log('[Seed] Seeding Users...');
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const customerPasswordHash = await bcrypt.hash('Customer@123', 10);

    const adminUserRes = await client.query(`
      INSERT INTO users (email, password_hash, full_name, phone, role_id, is_email_verified)
      VALUES ($1, $2, $3, $4, $5, TRUE)
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id;
    `, ['admin@shelfsync.com', adminPasswordHash, 'ShelfSync Admin', '+919876543210', adminRoleId]);

    const customerUserRes = await client.query(`
      INSERT INTO users (email, password_hash, full_name, phone, role_id, is_email_verified)
      VALUES ($1, $2, $3, $4, $5, TRUE)
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id;
    `, ['customer@shelfsync.com', customerPasswordHash, 'Aarav Sharma', '+919820012345', customerRoleId]);

    const customerId = customerUserRes.rows[0].id;

    // 3. Seed Saved Customer Address
    console.log('[Seed] Seeding Addresses...');
    await client.query(`
      INSERT INTO addresses (user_id, recipient_name, phone, address_line1, address_line2, city, state, postal_code, is_default)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
      ON CONFLICT DO NOTHING;
    `, [
      customerId,
      'Aarav Sharma',
      '+919820012345',
      'Flat 402, Sunshine Heights',
      'Powai Vihar, Hiranandani',
      'Mumbai',
      'Maharashtra',
      '400076'
    ]);

    // 4. Seed Categories
    console.log('[Seed] Seeding Categories...');
    const categoryMap = new Map<string, number>();
    for (const cat of SEED_CATEGORIES) {
      const res = await client.query(`
        INSERT INTO categories (name, slug, description, image_url)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, image_url = EXCLUDED.image_url
        RETURNING id;
      `, [cat.name, cat.slug, cat.description, cat.image_url]);
      categoryMap.set(cat.slug, res.rows[0].id);
    }

    // 5. Seed Warehouses
    console.log('[Seed] Seeding Warehouses...');
    const warehouseMap = new Map<string, number>();
    for (const wh of SEED_WAREHOUSES) {
      const res = await client.query(`
        INSERT INTO warehouses (code, name, city, state, postal_code)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, city = EXCLUDED.city
        RETURNING id;
      `, [wh.code, wh.name, wh.city, wh.state, wh.postal_code]);
      warehouseMap.set(wh.city, res.rows[0].id);
    }
    const defaultWarehouseId = warehouseMap.values().next().value;

    // 6. Seed Products, Images & Inventory
    console.log(`[Seed] Seeding ${SEED_PRODUCTS.length} realistic Products & Inventory...`);
    for (const prod of SEED_PRODUCTS) {
      const catId = categoryMap.get(prod.category) || 1;
      const prodRes = await client.query(`
        INSERT INTO products (name, slug, description, sku, category_id, brand, base_price, discount_percent, rating, review_count, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          base_price = EXCLUDED.base_price,
          discount_percent = EXCLUDED.discount_percent,
          rating = EXCLUDED.rating,
          description = EXCLUDED.description
        RETURNING id;
      `, [
        prod.name,
        prod.slug,
        prod.description,
        prod.sku,
        catId,
        prod.brand,
        prod.base_price,
        prod.discount_percent,
        prod.rating,
        prod.review_count
      ]);
      const productId = prodRes.rows[0].id;

      // Seed Product Image
      await client.query(`
        INSERT INTO product_images (product_id, image_url, alt_text, is_primary, display_order)
        VALUES ($1, $2, $3, TRUE, 0)
        ON CONFLICT DO NOTHING;
      `, [productId, prod.imageUrl, prod.name]);

      // Seed Inventory
      const whId = warehouseMap.get(prod.warehouseCity) || defaultWarehouseId;
      await client.query(`
        INSERT INTO inventory (product_id, warehouse_id, quantity, reserved_quantity)
        VALUES ($1, $2, $3, 0)
        ON CONFLICT (product_id, warehouse_id) DO UPDATE SET quantity = EXCLUDED.quantity;
      `, [productId, whId, prod.stock]);
    }

    await client.query('COMMIT');
    console.log('[Seed] Database successfully seeded with categories, users, warehouses, and 24 catalogue products!');
    return { success: true, message: 'Database seeded successfully' };
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('[Seed] Database seeding failed:', error);
    return { success: false, message: error.message };
  } finally {
    client.release();
  }
}

// Allow standalone execution
if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replace(/\\/g, '/')}`).href) {
  seedDatabase()
    .then((res) => {
      console.log('[Seed Result]', res);
      process.exit(res.success ? 0 : 1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
