import { demoHomepage, demoProducts } from './worker-data.js';

function isAdminRoute(pathname) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function isBackendRoute(pathname) {
  return pathname === '/api' || pathname.startsWith('/api/') || pathname === '/backend' || pathname.startsWith('/backend/');
}

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

function buildSlug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'item';
}

function demoApi(request, url) {
  const path = url.pathname.replace(/^\/backend/, '').replace(/^\/api/, '') || '/';

  if (request.method === 'GET' && path === '/health') {
    return json({ status: 'ok', service: 'raw-culture-worker-demo' });
  }

  if (request.method === 'POST' && path === '/auth/login') {
    return json({
      token: 'raw-culture-demo-admin-token',
      admin: { id: 'demo-admin', email: 'admin@rawculture.com', name: 'RAW-CULTURE Admin' },
    });
  }

  if (request.method === 'GET' && path === '/auth/me') {
    return json({
      admin: { id: 'demo-admin', email: 'admin@rawculture.com', name: 'RAW-CULTURE Admin' },
    });
  }

  if (request.method === 'GET' && path === '/products') return json(demoProducts);

  if (request.method === 'GET' && path.startsWith('/products/')) {
    const id = path.split('/').pop();
    const product = demoProducts.find((item) => item.id === id || item.slug === id);
    return product ? json(product) : json({ message: 'Product not found' }, 404);
  }

  if (request.method === 'GET' && path === '/content/homepage') return json(demoHomepage);
  if (request.method === 'PUT' && path === '/content/homepage') return json({ ...demoHomepage, message: 'Updated' });

  if (request.method === 'GET' && path === '/categories') {
    const categories = [
      { id: 'cat-1', name: 'T-Shirts', slug: 't-shirts', description: 'Clean daily staples', productCount: 4 },
      { id: 'cat-2', name: 'Hoodies', slug: 'hoodies', description: 'Comfortable elevated essentials', productCount: 3 },
      { id: 'cat-3', name: 'Pants', slug: 'pants', description: 'Relaxed utility silhouettes', productCount: 3 },
      { id: 'cat-4', name: 'Jackets', slug: 'jackets', description: 'Statement outerwear', productCount: 2 },
      { id: 'cat-5', name: 'Accessories', slug: 'accessories', description: 'Finishing touches', productCount: 3 },
    ];
    return json(categories);
  }

  if (request.method === 'GET' && path === '/collections') {
    return json([
      { id: 'col-1', name: 'Summer 2026', slug: 'summer-2026', description: 'Warm-season essentials', productCount: 6, isActive: true },
      { id: 'col-2', name: 'Street Essentials', slug: 'street-essentials', description: 'The everyday uniform', productCount: 8, isActive: true },
      { id: 'col-3', name: 'Midnight Collection', slug: 'midnight-collection', description: 'Dark and elevated silhouettes', productCount: 4, isActive: true },
    ]);
  }

  if (request.method === 'GET' && path === '/inventory') {
    return json(
      demoProducts.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category.name,
        price: p.price,
        stock: p.stock,
        soldQuantity: 3,
        status: p.status,
        lowStockWarning: p.stock < 10,
        outOfStock: p.stock === 0,
        image: p.images?.[0]?.url,
      }))
    );
  }

  if (request.method === 'GET' && path === '/dashboard') {
    return json({
      totalSales: 12450,
      todaysSales: 640,
      monthlySales: 12450,
      totalOrders: 8,
      totalCustomers: 6,
      totalProducts: demoProducts.length,
      lowStockProducts: demoProducts.filter((p) => p.stock < 10).length,
      outOfStockProducts: 0,
      pendingOrders: 2,
      confirmedOrders: 2,
      processingOrders: 2,
      shippedOrders: 1,
      deliveredOrders: 1,
      cancelledOrders: 0,
      salesByMonth: [
        { month: 'Apr', sales: 1200 },
        { month: 'May', sales: 2400 },
        { month: 'Jun', sales: 3100 },
        { month: 'Jul', sales: 2800 },
        { month: 'Aug', sales: 4200 },
        { month: 'Sep', sales: 5100 },
      ],
      recentOrders: [
        { id: 'demo-ord-1', orderNumber: 'RC-2026001', customerName: 'Alex Mercer', email: 'alex@example.com', total: 192, status: 'PENDING', paymentMethod: 'cod', paymentStatus: 'PENDING', createdAt: new Date().toISOString() },
        { id: 'demo-ord-2', orderNumber: 'RC-2026002', customerName: 'Sarah Jenkins', email: 'sarah@example.com', total: 276, status: 'DELIVERED', paymentMethod: 'cod', paymentStatus: 'PAID', createdAt: new Date().toISOString() },
      ],
      recentCustomers: [
        { id: 'cust-1', name: 'Alex Mercer', email: 'alex@example.com', ordersCount: 1, totalSpent: 192, createdAt: new Date().toISOString() },
        { id: 'cust-2', name: 'Sarah Jenkins', email: 'sarah@example.com', ordersCount: 2, totalSpent: 540, createdAt: new Date().toISOString() },
      ],
    });
  }

  if (request.method === 'GET' && path === '/orders') {
    return json([
      {
        id: 'demo-ord-1',
        orderNumber: 'RC-2026001',
        email: 'alex@example.com',
        name: 'Alex Mercer',
        phone: '+91 98765 11111',
        total: 192,
        subtotal: 192,
        shippingFee: 0,
        discount: 0,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: 'cod',
        shippingAddress: { line1: '42 Fashion St', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001', country: 'India' },
        items: [
          { productId: demoProducts[0].id, name: demoProducts[0].name, sku: demoProducts[0].sku, size: 'L', color: 'Black', quantity: 2, price: 64, total: 128, image: demoProducts[0].images[0]?.url },
          { productId: demoProducts[1].id, name: demoProducts[1].name, sku: demoProducts[1].sku, size: 'M', color: 'Black', quantity: 1, price: 64, total: 64, image: demoProducts[1].images[0]?.url },
        ],
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  if (request.method === 'GET' && path.startsWith('/orders/')) {
    return json({
      id: 'demo-ord-1',
      orderNumber: 'RC-2026001',
      email: 'alex@example.com',
      name: 'Alex Mercer',
      phone: '+91 98765 11111',
      total: 192,
      subtotal: 192,
      shippingFee: 0,
      discount: 0,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      paymentMethod: 'cod',
      shippingAddress: { line1: '42 Fashion St', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001', country: 'India' },
      items: [
        { productId: demoProducts[0].id, name: demoProducts[0].name, sku: demoProducts[0].sku, size: 'L', color: 'Black', quantity: 2, price: 64, total: 128, image: demoProducts[0].images[0]?.url },
        { productId: demoProducts[1].id, name: demoProducts[1].name, sku: demoProducts[1].sku, size: 'M', color: 'Black', quantity: 1, price: 64, total: 64, image: demoProducts[1].images[0]?.url },
      ],
      createdAt: new Date().toISOString(),
    });
  }

  if (request.method === 'GET' && path === '/customers') {
    return json([
      { id: 'demo-cust-1', name: 'Alex Mercer', email: 'alex@example.com', phone: '+91 98765 11111', orders: 1, totalSpent: 192, totalSpending: 192, lastOrder: new Date().toISOString(), status: 'ACTIVE' },
    ]);
  }

  if (request.method === 'GET' && path.startsWith('/customers/')) {
    return json({
      id: 'demo-cust-1',
      name: 'Alex Mercer',
      email: 'alex@example.com',
      phone: '+91 98765 11111',
      totalSpent: 192,
      ordersCount: 1,
      addresses: [{ line1: '42 Fashion St', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001', country: 'India' }],
      orders: [{ id: 'demo-ord-1', orderNumber: 'RC-2026001', status: 'PENDING', paymentStatus: 'PENDING', total: 192, createdAt: new Date().toISOString() }],
      productsPurchased: [{ productId: demoProducts[0].id, name: demoProducts[0].name, sku: demoProducts[0].sku, image: demoProducts[0].images[0]?.url, totalQuantity: 2, totalSpend: 128 }],
    });
  }

  if (request.method === 'GET' && path === '/coupons') {
    return json([
      { id: 'c-1', code: 'RAW10', discountType: 'PERCENTAGE', discountValue: 10, minOrderAmount: 200, maxUses: 500, usedCount: 14, isActive: true },
      { id: 'c-2', code: 'STREET50', discountType: 'FIXED', discountValue: 50, minOrderAmount: 300, maxUses: 200, usedCount: 5, isActive: true },
    ]);
  }

  if (request.method === 'POST' && path === '/coupons/validate') {
    return json({ valid: true, code: 'RAW10', discountType: 'PERCENTAGE', discountValue: 10, discountAmount: 20, minOrderAmount: 200, message: 'Coupon applied: 10% off' });
  }

  if (request.method === 'GET' && path === '/media') {
    return json([
      { id: 'm-1', name: 'Hero Front', url: '/products/tshirt/front.jpg', type: 'image' },
      { id: 'm-2', name: 'Hoodie Look', url: '/products/hoodie/front.jpg', type: 'image' },
    ]);
  }

  if (request.method === 'GET' && path === '/videos') {
    return json([
      { id: 'v-1', title: 'RAW Movement 2026', url: 'https://videos.pexels.com/video-files/6487458/6487458-hd_1920_1080.mp4', isActive: true },
    ]);
  }

  if (request.method === 'GET' && path === '/settings') {
    return json({ id: 'default', storeName: 'RAW-CULTURE', currency: 'INR', supportEmail: 'support@rawculture.com', phone: '+91 98765 43210', address: 'Mumbai, India' });
  }

  return json({ message: 'Success' });
}

async function hashPassword(password) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function productFromRow(row, images, videos) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    description: row.description,
    price: row.price,
    compareAtPrice: row.sale_price < row.price ? row.price + 20 : null,
    salePrice: row.sale_price,
    costPrice: row.cost_price,
    stock: row.stock,
    status: row.status,
    featured: Boolean(row.featured),
    newArrival: Boolean(row.new_arrival),
    bestSeller: Boolean(row.best_seller),
    category: { name: row.category || 'Shop', slug: (row.category || 'shop').toLowerCase().replace(/[^a-z0-9]+/g, '-') },
    tags: JSON.parse(row.tags || '[]'),
    sizes: JSON.parse(row.sizes || '[]'),
    colors: JSON.parse(row.colors || '[]'),
    images,
    videos,
  };
}

async function ensureDatabase(db) {
  await db.batch([
    db.prepare('CREATE TABLE IF NOT EXISTS admins (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, password_hash TEXT NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, sku TEXT NOT NULL UNIQUE, description TEXT NOT NULL DEFAULT \'\', price REAL NOT NULL, sale_price REAL NOT NULL DEFAULT 0, cost_price REAL NOT NULL DEFAULT 0, stock INTEGER NOT NULL DEFAULT 0, category TEXT NOT NULL DEFAULT \'Shop\', tags TEXT NOT NULL DEFAULT \'[]\', sizes TEXT NOT NULL DEFAULT \'[]\', colors TEXT NOT NULL DEFAULT \'[]\', status TEXT NOT NULL DEFAULT \'IN_STOCK\', featured INTEGER NOT NULL DEFAULT 0, new_arrival INTEGER NOT NULL DEFAULT 0, best_seller INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)'),
    db.prepare('CREATE TABLE IF NOT EXISTS product_images (id TEXT PRIMARY KEY, product_id TEXT NOT NULL, url TEXT NOT NULL, alt TEXT NOT NULL DEFAULT \'\', ordering INTEGER NOT NULL DEFAULT 0)'),
    db.prepare('CREATE TABLE IF NOT EXISTS product_videos (id TEXT PRIMARY KEY, product_id TEXT NOT NULL, url TEXT NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS homepage_content (id INTEGER PRIMARY KEY CHECK (id = 1), hero_title TEXT NOT NULL, hero_subtitle TEXT NOT NULL, hero_button1 TEXT NOT NULL, hero_button2 TEXT NOT NULL, hero_image TEXT NOT NULL, hero_video TEXT NOT NULL, brand_story TEXT NOT NULL, newsletter_title TEXT NOT NULL, newsletter_copy TEXT NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, order_number TEXT NOT NULL UNIQUE, email TEXT NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL, shipping_address TEXT NOT NULL, items TEXT NOT NULL, subtotal REAL NOT NULL DEFAULT 0, shipping_fee REAL NOT NULL DEFAULT 0, discount REAL NOT NULL DEFAULT 0, total REAL NOT NULL, status TEXT NOT NULL DEFAULT \'PENDING\', payment_status TEXT NOT NULL DEFAULT \'PENDING\', payment_method TEXT NOT NULL DEFAULT \'cod\', tracking_number TEXT, shipping_provider TEXT, notes TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)'),
    db.prepare('CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, slug TEXT NOT NULL UNIQUE, description TEXT, image_url TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)'),
    db.prepare('CREATE TABLE IF NOT EXISTS collections (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, slug TEXT NOT NULL UNIQUE, description TEXT, image_url TEXT, is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)'),
    db.prepare('CREATE TABLE IF NOT EXISTS coupons (id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, discount_type TEXT NOT NULL DEFAULT \'PERCENTAGE\', discount_value REAL NOT NULL, min_order_amount REAL NOT NULL DEFAULT 0, max_uses INTEGER, used_count INTEGER NOT NULL DEFAULT 0, expires_at TEXT, is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)'),
    db.prepare('CREATE TABLE IF NOT EXISTS media_assets (id TEXT PRIMARY KEY, type TEXT NOT NULL, url TEXT NOT NULL, name TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)'),
    db.prepare('CREATE TABLE IF NOT EXISTS videos (id TEXT PRIMARY KEY, title TEXT NOT NULL, url TEXT NOT NULL, thumbnail TEXT, product_id TEXT, is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)'),
    db.prepare('CREATE TABLE IF NOT EXISTS store_settings (id TEXT PRIMARY KEY, store_name TEXT NOT NULL DEFAULT \'RAW-CULTURE\', currency TEXT NOT NULL DEFAULT \'INR\', support_email TEXT NOT NULL DEFAULT \'support@rawculture.com\', phone TEXT NOT NULL DEFAULT \'+91 98765 43210\', address TEXT NOT NULL DEFAULT \'Mumbai, India\', updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)'),
  ]);

  const orderInfo = await db.prepare('PRAGMA table_info(orders)').all();
  const existingOrderColumns = new Set((orderInfo.results || []).map((column) => column.name));
  const legacyOrderColumns = [
    'shipping_fee',
    'discount',
    'tracking_number',
    'shipping_provider',
    'notes',
  ];

  for (const columnName of legacyOrderColumns) {
    if (!existingOrderColumns.has(columnName)) {
      await db.prepare(`ALTER TABLE orders ADD COLUMN ${columnName} TEXT`).run();
    }
  }

  const count = await db.prepare('SELECT COUNT(*) AS count FROM products').first();
  if (Number(count.count) > 0) return;

  const passwordHash = await hashPassword('Admin@123');
  const statements = [
    db.prepare('INSERT OR IGNORE INTO admins (id, email, name, password_hash) VALUES (?, ?, ?, ?)').bind('demo-admin', 'admin@rawculture.com', 'RAW-CULTURE Admin', passwordHash),
    db.prepare('INSERT OR IGNORE INTO store_settings (id, store_name, currency, support_email, phone, address) VALUES (?, ?, ?, ?, ?, ?)').bind('default', 'RAW-CULTURE', 'INR', 'support@rawculture.com', '+91 98765 43210', 'Mumbai, India'),
    db.prepare('INSERT OR IGNORE INTO coupons (id, code, discount_type, discount_value, min_order_amount, max_uses, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)').bind('c-1', 'RAW10', 'PERCENTAGE', 10, 200, 500, 1),
    db.prepare('INSERT OR IGNORE INTO coupons (id, code, discount_type, discount_value, min_order_amount, max_uses, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)').bind('c-2', 'STREET50', 'FIXED', 50, 300, 200, 1),
  ];

  for (const cat of ['T-Shirts', 'Hoodies', 'Pants', 'Jackets', 'Accessories', 'Shirts']) {
    statements.push(db.prepare('INSERT OR IGNORE INTO categories (id, name, slug, description) VALUES (?, ?, ?, ?)').bind(`cat-${cat.toLowerCase()}`, cat, cat.toLowerCase(), `${cat} collection`));
  }

  for (const col of ['Summer 2026', 'Street Essentials', 'Midnight Collection']) {
    statements.push(db.prepare('INSERT OR IGNORE INTO collections (id, name, slug, description, is_active) VALUES (?, ?, ?, ?, 1)').bind(`col-${col.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, col, col.toLowerCase().replace(/[^a-z0-9]+/g, '-'), `${col} drop`));
  }

  for (const product of demoProducts) {
    statements.push(db.prepare('INSERT INTO products (id, name, slug, sku, description, price, sale_price, cost_price, stock, category, tags, sizes, colors, status, featured, new_arrival, best_seller) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(product.id, product.name, product.slug, product.sku, product.description, product.price, product.salePrice, product.price * 0.45, product.stock, product.category.name, JSON.stringify(product.tags), JSON.stringify(product.sizes), JSON.stringify(product.colors), product.status, Number(product.featured), Number(product.newArrival), Number(product.bestSeller)));
    for (const image of product.images) statements.push(db.prepare('INSERT INTO product_images (id, product_id, url, alt, ordering) VALUES (?, ?, ?, ?, ?)').bind(image.id, product.id, image.url, image.alt, image.ordering));
  }

  statements.push(db.prepare('INSERT OR REPLACE INTO homepage_content (id, hero_title, hero_subtitle, hero_button1, hero_button2, hero_image, hero_video, brand_story, newsletter_title, newsletter_copy) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(demoHomepage.heroTitle, demoHomepage.heroSubtitle, demoHomepage.heroButton1, demoHomepage.heroButton2, demoHomepage.heroImage, demoHomepage.heroVideo, demoHomepage.brandStory, demoHomepage.newsletterTitle, demoHomepage.newsletterCopy));

  await db.batch(statements);
}

async function databaseApi(request, url, db) {
  await ensureDatabase(db);
  const path = url.pathname.replace(/^\/backend/, '').replace(/^\/api/, '') || '/';

  // OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return json({ ok: true });
  }

  // Health
  if (request.method === 'GET' && path === '/health') {
    return json({ status: 'ok', service: 'raw-culture-d1' });
  }

  // Auth login
  if (request.method === 'POST' && path === '/auth/login') {
    const body = await request.json();
    const admin = await db.prepare('SELECT id, email, name, password_hash FROM admins WHERE email = ?').bind(body.email).first();
    if (!admin || admin.password_hash !== (await hashPassword(body.password || ''))) {
      return json({ message: 'Invalid email or password' }, 401);
    }
    return json({ token: 'raw-culture-d1-admin-token', admin: { id: admin.id, email: admin.email, name: admin.name } });
  }

  // Auth me
  if (request.method === 'GET' && path === '/auth/me') {
    const admin = await db.prepare('SELECT id, email, name FROM admins LIMIT 1').first();
    return json({ admin: admin || { id: 'admin-1', email: 'admin@rawculture.com', name: 'RAW-CULTURE Admin' } });
  }

  // Content
  if (request.method === 'GET' && path === '/content/homepage') {
    return json(await db.prepare('SELECT hero_title AS heroTitle, hero_subtitle AS heroSubtitle, hero_button1 AS heroButton1, hero_button2 AS heroButton2, hero_image AS heroImage, hero_video AS heroVideo, brand_story AS brandStory, newsletter_title AS newsletterTitle, newsletter_copy AS newsletterCopy FROM homepage_content WHERE id = 1').first());
  }
  if (request.method === 'PUT' && path === '/content/homepage') {
    const b = await request.json();
    await db.prepare('UPDATE homepage_content SET hero_title = ?, hero_subtitle = ?, hero_button1 = ?, hero_button2 = ?, hero_image = ?, hero_video = ?, brand_story = ?, newsletter_title = ?, newsletter_copy = ? WHERE id = 1').bind(b.heroTitle, b.heroSubtitle, b.heroButton1, b.heroButton2, b.heroImage, b.heroVideo, b.brandStory, b.newsletterTitle, b.newsletterCopy).run();
    return json({ success: true, message: 'Homepage updated' });
  }

  // Categories
  if (request.method === 'GET' && path === '/categories') {
    const categories = await db.prepare('SELECT id, name, slug, description, image_url AS imageUrl, created_at AS createdAt FROM categories ORDER BY name ASC').all();
    return json(categories.results);
  }
  if (request.method === 'POST' && path === '/categories') {
    const b = await request.json();
    const id = `cat-${crypto.randomUUID()}`;
    const slug = b.slug || buildSlug(b.name);
    await db.prepare('INSERT INTO categories (id, name, slug, description, image_url) VALUES (?, ?, ?, ?, ?)').bind(id, b.name, slug, b.description || '', b.imageUrl || '').run();
    return json({ id, name: b.name, slug, description: b.description, imageUrl: b.imageUrl, productCount: 0 }, 201);
  }
  if (request.method === 'PUT' && path.startsWith('/categories/')) {
    const id = path.split('/').pop();
    const b = await request.json();
    await db.prepare('UPDATE categories SET name = ?, slug = ?, description = ?, image_url = ? WHERE id = ?').bind(b.name, b.slug || buildSlug(b.name), b.description, b.imageUrl, id).run();
    return json({ id, ...b });
  }
  if (request.method === 'DELETE' && path.startsWith('/categories/')) {
    const id = path.split('/').pop();
    await db.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
    return json({ success: true });
  }

  // Collections
  if (request.method === 'GET' && path === '/collections') {
    const cols = await db.prepare('SELECT id, name, slug, description, image_url AS imageUrl, is_active AS isActive, created_at AS createdAt FROM collections ORDER BY created_at DESC').all();
    return json(cols.results.map((c) => ({ ...c, isActive: Boolean(c.isActive), productCount: 0 })));
  }
  if (request.method === 'POST' && path === '/collections') {
    const b = await request.json();
    const id = `col-${crypto.randomUUID()}`;
    const slug = b.slug || buildSlug(b.name);
    await db.prepare('INSERT INTO collections (id, name, slug, description, image_url, is_active) VALUES (?, ?, ?, ?, ?, ?)').bind(id, b.name, slug, b.description || '', b.imageUrl || '', b.isActive !== false ? 1 : 0).run();
    return json({ id, name: b.name, slug, description: b.description, imageUrl: b.imageUrl, isActive: b.isActive !== false }, 201);
  }
  if (request.method === 'PUT' && path.startsWith('/collections/')) {
    const id = path.split('/').pop();
    const b = await request.json();
    await db.prepare('UPDATE collections SET name = ?, slug = ?, description = ?, image_url = ?, is_active = ? WHERE id = ?').bind(b.name, b.slug || buildSlug(b.name), b.description, b.imageUrl, b.isActive ? 1 : 0, id).run();
    return json({ id, ...b });
  }
  if (request.method === 'DELETE' && path.startsWith('/collections/')) {
    const id = path.split('/').pop();
    await db.prepare('DELETE FROM collections WHERE id = ?').bind(id).run();
    return json({ success: true });
  }

  // Inventory
  if (request.method === 'GET' && path === '/inventory') {
    const products = await db.prepare('SELECT id, name, sku, category, price, stock, status, updated_at AS updatedAt FROM products ORDER BY stock ASC').all();
    const images = await db.prepare('SELECT product_id, url FROM product_images WHERE ordering = 0').all();
    const imgMap = new Map(images.results.map((i) => [i.product_id, i.url]));

    return json(
      products.results.map((p) => ({
        ...p,
        soldQuantity: 0,
        lowStockWarning: p.stock > 0 && p.stock < 10,
        outOfStock: p.stock === 0,
        image: imgMap.get(p.id) || null,
      }))
    );
  }
  if ((request.method === 'PUT' || request.method === 'PATCH') && path.startsWith('/inventory/')) {
    const id = path.split('/').pop();
    const b = await request.json();
    const stock = Math.max(0, parseInt(b.stock || 0, 10));
    const status = b.status || (stock === 0 ? 'OUT_OF_STOCK' : stock < 10 ? 'LOW_STOCK' : 'IN_STOCK');
    await db.prepare('UPDATE products SET stock = ?, status = ? WHERE id = ?').bind(stock, status, id).run();
    return json({ id, stock, status, success: true });
  }

  // Products
  if (request.method === 'GET' && path === '/products') {
    const rows = await db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
    const images = await db.prepare('SELECT id, product_id, url, alt, ordering FROM product_images ORDER BY ordering ASC').all();
    const videos = await db.prepare('SELECT id, product_id, url FROM product_videos').all();

    const imageMap = {};
    for (const img of images.results) {
      if (!imageMap[img.product_id]) imageMap[img.product_id] = [];
      imageMap[img.product_id].push(img);
    }

    const videoMap = {};
    for (const vid of videos.results) {
      if (!videoMap[vid.product_id]) videoMap[vid.product_id] = [];
      videoMap[vid.product_id].push(vid);
    }

    return json(rows.results.map((row) => productFromRow(row, imageMap[row.id] || [], videoMap[row.id] || [])));
  }

  if (request.method === 'GET' && path.startsWith('/products/')) {
    const identifier = path.split('/').pop();
    const row = await db.prepare('SELECT * FROM products WHERE id = ? OR slug = ?').bind(identifier, identifier).first();
    if (!row) return json({ message: 'Product not found' }, 404);
    const images = await db.prepare('SELECT id, url, alt, ordering FROM product_images WHERE product_id = ? ORDER BY ordering').bind(row.id).all();
    const videos = await db.prepare('SELECT id, url FROM product_videos WHERE product_id = ?').bind(row.id).all();
    return json(productFromRow(row, images.results, videos.results));
  }

  if (request.method === 'DELETE' && path.startsWith('/products/')) {
    const id = path.split('/').pop();
    await db.prepare('DELETE FROM product_images WHERE product_id = ?').bind(id).run();
    await db.prepare('DELETE FROM product_videos WHERE product_id = ?').bind(id).run();
    await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
    return json({ success: true });
  }

  if (request.method === 'PATCH' && path.match(/^\/products\/[^/]+\/status$/)) {
    const id = path.split('/')[2];
    const b = await request.json();
    await db.prepare('UPDATE products SET status = ? WHERE id = ?').bind(b.status, id).run();
    return json({ success: true, status: b.status });
  }

  // Create or Update Product
  if ((request.method === 'POST' || request.method === 'PUT') && (path === '/products' || path.startsWith('/products/'))) {
    const body = await request.json();
    const id = path.startsWith('/products/') ? path.split('/').pop() : `product-${crypto.randomUUID()}`;
    const slug = buildSlug(body.name) + '-' + Date.now().toString().slice(-4);
    const stock = Number(body.stock || 0);
    const status = body.status || (stock === 0 ? 'OUT_OF_STOCK' : stock < 10 ? 'LOW_STOCK' : 'IN_STOCK');

    const values = [
      id,
      body.name,
      slug,
      body.sku,
      body.description || '',
      Number(body.price),
      Number(body.salePrice || body.price),
      Number(body.costPrice || 0),
      stock,
      body.category || body.categories?.[0] || 'Shop',
      JSON.stringify(body.tags || []),
      JSON.stringify(body.sizes || ['S', 'M', 'L', 'XL']),
      JSON.stringify(body.colors || ['Black']),
      status,
      Number(Boolean(body.featured)),
      Number(Boolean(body.newArrival)),
      Number(Boolean(body.bestSeller)),
    ];

    await db.prepare('INSERT OR REPLACE INTO products (id, name, slug, sku, description, price, sale_price, cost_price, stock, category, tags, sizes, colors, status, featured, new_arrival, best_seller, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)').bind(...values).run();

    if (Array.isArray(body.imageUrls)) {
      await db.prepare('DELETE FROM product_images WHERE product_id = ?').bind(id).run();
      for (const [ordering, url] of body.imageUrls.entries()) {
        await db.prepare('INSERT INTO product_images (id, product_id, url, alt, ordering) VALUES (?, ?, ?, ?, ?)').bind(`${id}-image-${ordering}`, id, url, body.name || 'Product', ordering).run();
      }
    }

    return json({ id, success: true });
  }

  // Orders
  if (request.method === 'POST' && path === '/orders') {
    const body = await request.json();
    if (!body.email || !body.name || !Array.isArray(body.items) || !body.items.length) {
      return json({ message: 'Name, email, and cart items are required' }, 400);
    }

    const orderId = `order-${crypto.randomUUID()}`;
    const orderNumber = `RC-${Date.now().toString().slice(-8)}`;

    const fullItems = [];
    let calculatedSubtotal = 0;

    for (const item of body.items) {
      const product = await db.prepare('SELECT id, name, sku, price, sale_price, stock, category FROM products WHERE id = ?').bind(item.productId).first();
      const unitPrice = product ? Number(product.sale_price || product.price) : Number(item.price);
      const quantity = Number(item.quantity || 1);
      calculatedSubtotal += unitPrice * quantity;

      fullItems.push({
        productId: item.productId,
        name: item.name,
        sku: item.sku || product?.sku || 'N/A',
        category: item.category || product?.category || 'Streetwear',
        image: item.image || '',
        size: item.size || 'Standard',
        color: item.color || 'Standard',
        variant: item.variant || item.color || 'Standard',
        variantId: item.variantId || item.productId,
        quantity,
        price: unitPrice,
        total: unitPrice * quantity,
      });

      if (product) {
        const remaining = Math.max(0, product.stock - quantity);
        await db.prepare('UPDATE products SET stock = ?, status = ? WHERE id = ?').bind(remaining, remaining === 0 ? 'OUT_OF_STOCK' : remaining < 10 ? 'LOW_STOCK' : 'IN_STOCK', item.productId).run();
      }
    }

    const discount = Number(body.discount || 0);
    const shippingFee = Number(body.shippingFee || 0);
    const grandTotal = Math.max(0, calculatedSubtotal - discount + shippingFee);
    const paymentMethod = body.paymentMethod || 'cod';
    const paymentStatus = paymentMethod === 'online' ? 'PAID' : 'PENDING';
    const shippingSnapshot = {
      street: body.shippingAddress?.line1 || body.shippingAddress?.street || '',
      apartment: body.shippingAddress?.line2 || body.shippingAddress?.apartment || '',
      city: body.shippingAddress?.city || '',
      state: body.shippingAddress?.state || '',
      postalCode: body.shippingAddress?.postalCode || '',
      country: body.shippingAddress?.country || 'India',
      name: body.name || '',
      email: body.email || '',
      phone: body.phone || '',
    };

    await db.prepare('INSERT INTO orders (id, order_number, email, name, phone, shipping_address, items, subtotal, shipping_fee, discount, total, payment_method, payment_status, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(
      orderId,
      orderNumber,
      body.email,
      body.name,
      body.phone || '',
      JSON.stringify({ ...shippingSnapshot, ...body.shippingAddress }),
      JSON.stringify(fullItems),
      calculatedSubtotal,
      shippingFee,
      discount,
      grandTotal,
      paymentMethod,
      paymentStatus,
      'PENDING'
    ).run();

    return json({ id: orderId, orderNumber, status: 'PENDING', paymentStatus, total: grandTotal }, 201);
  }

  if (request.method === 'GET' && path === '/orders') {
    const result = await db.prepare('SELECT id, order_number AS orderNumber, email, name, phone, total, subtotal, shipping_fee AS shippingFee, discount, status, payment_status AS paymentStatus, payment_method AS paymentMethod, shipping_address AS shippingAddress, items, created_at AS createdAt FROM orders ORDER BY created_at DESC').all();
    return json(
      result.results.map((o) => {
        const parsedShipping = JSON.parse(o.shippingAddress || '{}');
        const parsedItems = JSON.parse(o.items || '[]');
        return {
          ...o,
          customer: { name: o.name, email: o.email, phone: o.phone },
          shippingAddress: {
            ...parsedShipping,
            street: parsedShipping.street || parsedShipping.line1 || '',
            apartment: parsedShipping.apartment || parsedShipping.line2 || '',
            postalCode: parsedShipping.postalCode || parsedShipping.postal_code || '',
          },
          items: parsedItems,
        };
      })
    );
  }

  if (request.method === 'GET' && path.startsWith('/orders/')) {
    const id = path.split('/').pop();
    const order = await db.prepare('SELECT id, order_number AS orderNumber, email, name, phone, shipping_address AS shippingAddress, items, total, subtotal, shipping_fee AS shippingFee, discount, status, payment_status AS paymentStatus, payment_method AS paymentMethod, tracking_number AS trackingNumber, shipping_provider AS shippingProvider, notes, created_at AS createdAt FROM orders WHERE id = ? OR order_number = ?').bind(id, id).first();
    if (!order) return json({ message: 'Order not found' }, 404);
    const parsedShipping = JSON.parse(order.shippingAddress || '{}');
    return json({
      ...order,
      customer: { name: order.name, email: order.email, phone: order.phone },
      shippingAddress: {
        ...parsedShipping,
        street: parsedShipping.street || parsedShipping.line1 || '',
        apartment: parsedShipping.apartment || parsedShipping.line2 || '',
        postalCode: parsedShipping.postalCode || parsedShipping.postal_code || '',
      },
      items: JSON.parse(order.items || '[]'),
    });
  }

  if ((request.method === 'PATCH' || request.method === 'PUT') && path.match(/^\/orders\/[^/]+\/status$/)) {
    const id = path.split('/')[2];
    const b = await request.json();
    await db.prepare('UPDATE orders SET status = ?, payment_status = COALESCE(?, payment_status), tracking_number = COALESCE(?, tracking_number), shipping_provider = COALESCE(?, shipping_provider), notes = COALESCE(?, notes) WHERE id = ? OR order_number = ?').bind(b.status, b.paymentStatus || null, b.trackingNumber || null, b.shippingProvider || null, b.notes || null, id, id).run();
    return json({ success: true, status: b.status });
  }

  // Customers
  if (request.method === 'GET' && path === '/customers') {
    const orders = await db.prepare('SELECT email, name, phone, total, created_at FROM orders ORDER BY created_at DESC').all();
    const customerMap = {};
    for (const o of orders.results) {
      if (!customerMap[o.email]) {
        customerMap[o.email] = {
          id: `cust-${encodeURIComponent(o.email)}`,
          name: o.name,
          email: o.email,
          phone: o.phone,
          orders: 0,
          totalSpending: 0,
          totalSpent: 0,
          lastOrder: o.created_at,
          status: 'ACTIVE',
        };
      }
      customerMap[o.email].orders += 1;
      customerMap[o.email].totalSpending += Number(o.total || 0);
      customerMap[o.email].totalSpent += Number(o.total || 0);
    }
    return json(Object.values(customerMap));
  }

  if (request.method === 'GET' && path.startsWith('/customers/')) {
    const id = decodeURIComponent(path.split('/').pop().replace(/^cust-/, ''));
    const orders = await db.prepare('SELECT id, order_number AS orderNumber, total, status, payment_status AS paymentStatus, payment_method AS paymentMethod, items, shipping_address AS shippingAddress, created_at AS createdAt FROM orders WHERE email = ? ORDER BY created_at DESC').bind(id).all();
    const first = orders.results[0];

    const purchased = {};
    const addresses = [];
    for (const o of orders.results) {
      try {
        const addr = JSON.parse(o.shippingAddress);
        if (addr.line1) addresses.push(addr);
        const itms = JSON.parse(o.items);
        for (const it of itms) {
          if (!purchased[it.productId]) purchased[it.productId] = { ...it, totalQuantity: 0, totalSpend: 0 };
          purchased[it.productId].totalQuantity += it.quantity;
          purchased[it.productId].totalSpend += it.price * it.quantity;
        }
      } catch {}
    }

    return json({
      id: `cust-${id}`,
      name: first?.name || id,
      email: id,
      phone: first?.phone || '',
      ordersCount: orders.results.length,
      totalSpent: orders.results.reduce((s, o) => s + Number(o.total), 0),
      addresses,
      orders: orders.results.map((o) => ({ ...o, itemsCount: JSON.parse(o.items || '[]').length })),
      productsPurchased: Object.values(purchased),
    });
  }

  // Dashboard
  if (request.method === 'GET' && path === '/dashboard') {
    const products = await db.prepare('SELECT id, stock FROM products').all();
    const orders = await db.prepare('SELECT id, order_number AS orderNumber, email, name, phone, total, status, payment_status AS paymentStatus, payment_method AS paymentMethod, created_at AS createdAt FROM orders ORDER BY created_at DESC').all();

    const activeOrders = orders.results.filter((o) => o.status !== 'CANCELLED');
    const totalSales = activeOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const uniqueCustomers = new Set(orders.results.map((o) => o.email)).size;

    return json({
      totalSales,
      todaysSales: 0,
      monthlySales: totalSales,
      totalOrders: orders.results.length,
      totalCustomers: uniqueCustomers,
      totalProducts: products.results.length,
      lowStockProducts: products.results.filter((p) => p.stock < 10).length,
      outOfStockProducts: products.results.filter((p) => p.stock === 0).length,
      pendingOrders: orders.results.filter((o) => o.status === 'PENDING').length,
      confirmedOrders: orders.results.filter((o) => o.status === 'CONFIRMED').length,
      processingOrders: orders.results.filter((o) => o.status === 'PROCESSING').length,
      shippedOrders: orders.results.filter((o) => o.status === 'SHIPPED').length,
      deliveredOrders: orders.results.filter((o) => o.status === 'DELIVERED').length,
      cancelledOrders: orders.results.filter((o) => o.status === 'CANCELLED').length,
      salesByMonth: [
        { month: 'Apr', sales: totalSales * 0.1 },
        { month: 'May', sales: totalSales * 0.15 },
        { month: 'Jun', sales: totalSales * 0.2 },
        { month: 'Jul', sales: totalSales * 0.18 },
        { month: 'Aug', sales: totalSales * 0.22 },
        { month: 'Sep', sales: totalSales * 0.15 },
      ],
      recentOrders: orders.results.slice(0, 10),
      recentCustomers: [],
    });
  }

  // Coupons
  if (request.method === 'GET' && path === '/coupons') {
    const coupons = await db.prepare('SELECT id, code, discount_type AS discountType, discount_value AS discountValue, min_order_amount AS minOrderAmount, max_uses AS maxUses, used_count AS usedCount, expires_at AS expiresAt, is_active AS isActive, created_at AS createdAt FROM coupons ORDER BY created_at DESC').all();
    return json(coupons.results.map((c) => ({ ...c, isActive: Boolean(c.isActive) })));
  }
  if (request.method === 'POST' && path === '/coupons') {
    const b = await request.json();
    const id = `coupon-${crypto.randomUUID()}`;
    await db.prepare('INSERT INTO coupons (id, code, discount_type, discount_value, min_order_amount, max_uses, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, String(b.code).toUpperCase(), b.discountType || 'PERCENTAGE', Number(b.discountValue), Number(b.minOrderAmount || 0), b.maxUses ? Number(b.maxUses) : null, b.isActive !== false ? 1 : 0).run();
    return json({ id, ...b, code: String(b.code).toUpperCase() }, 201);
  }
  if (request.method === 'DELETE' && path.startsWith('/coupons/')) {
    const id = path.split('/').pop();
    await db.prepare('DELETE FROM coupons WHERE id = ?').bind(id).run();
    return json({ success: true });
  }
  if (request.method === 'POST' && path === '/coupons/validate') {
    const b = await request.json();
    const coupon = await db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1').bind(String(b.code || '').toUpperCase()).first();
    if (!coupon) return json({ valid: false, message: 'Invalid or inactive coupon code' }, 404);
    const sub = Number(b.subtotal || 0);
    if (sub < Number(coupon.min_order_amount)) return json({ valid: false, message: `Minimum spend of ₹${coupon.min_order_amount} required` }, 400);
    const discountAmount = coupon.discount_type === 'PERCENTAGE' ? (sub * Number(coupon.discount_value)) / 100 : Math.min(Number(coupon.discount_value), sub);
    return json({ valid: true, code: coupon.code, discountType: coupon.discount_type, discountValue: coupon.discount_value, discountAmount, minOrderAmount: coupon.min_order_amount });
  }

  // Media
  if (request.method === 'GET' && path === '/media') {
    const media = await db.prepare('SELECT id, type, url, name, created_at AS createdAt FROM media_assets ORDER BY created_at DESC').all();
    return json(media.results);
  }
  if (request.method === 'POST' && path === '/media') {
    const b = await request.json();
    const id = `media-${crypto.randomUUID()}`;
    await db.prepare('INSERT INTO media_assets (id, type, url, name) VALUES (?, ?, ?, ?)').bind(id, b.type || 'image', b.url, b.name).run();
    return json({ id, ...b }, 201);
  }
  if (request.method === 'DELETE' && path.startsWith('/media/')) {
    const id = path.split('/').pop();
    await db.prepare('DELETE FROM media_assets WHERE id = ?').bind(id).run();
    return json({ success: true });
  }

  // Videos
  if (request.method === 'GET' && path === '/videos') {
    const videos = await db.prepare('SELECT id, title, url, thumbnail, product_id AS productId, is_active AS isActive, created_at AS createdAt FROM videos ORDER BY created_at DESC').all();
    return json(videos.results.map((v) => ({ ...v, isActive: Boolean(v.isActive) })));
  }
  if (request.method === 'POST' && path === '/videos') {
    const b = await request.json();
    const id = `video-${crypto.randomUUID()}`;
    await db.prepare('INSERT INTO videos (id, title, url, thumbnail, product_id, is_active) VALUES (?, ?, ?, ?, ?, ?)').bind(id, b.title, b.url, b.thumbnail || '', b.productId || '', b.isActive !== false ? 1 : 0).run();
    return json({ id, ...b }, 201);
  }
  if (request.method === 'DELETE' && path.startsWith('/videos/')) {
    const id = path.split('/').pop();
    await db.prepare('DELETE FROM videos WHERE id = ?').bind(id).run();
    return json({ success: true });
  }

  // Settings
  if (request.method === 'GET' && path === '/settings') {
    const settings = await db.prepare('SELECT id, store_name AS storeName, currency, support_email AS supportEmail, phone, address, updated_at AS updatedAt FROM store_settings WHERE id = "default"').first();
    return json(settings || { storeName: 'RAW-CULTURE', currency: 'INR', supportEmail: 'support@rawculture.com', phone: '+91 98765 43210', address: 'Mumbai, India' });
  }
  if (request.method === 'PUT' && path === '/settings') {
    const b = await request.json();
    await db.prepare('INSERT OR REPLACE INTO store_settings (id, store_name, currency, support_email, phone, address, updated_at) VALUES ("default", ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)').bind(b.storeName || 'RAW-CULTURE', b.currency || 'INR', b.supportEmail || 'support@rawculture.com', b.phone || '+91 98765 43210', b.address || 'Mumbai, India').run();
    return json({ success: true, message: 'Settings saved' });
  }

  return json({ message: 'Unsupported API operation' }, 405);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle API / backend endpoints before any SPA fallback so /api/* never becomes HTML.
    if (isBackendRoute(url.pathname)) {
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      }

      if (env.raw_culture_db) {
        return databaseApi(request, url, env.raw_culture_db);
      }
      if (!env.BACKEND_URL) {
        return demoApi(request, url);
      }

      const backendPath = url.pathname.startsWith('/backend')
        ? url.pathname.slice('/backend'.length) || '/'
        : url.pathname;
      const backendUrl = new URL(`${backendPath}${url.search}`, env.BACKEND_URL);
      return fetch(new Request(backendUrl, request));
    }

    const isFileRequest = /\.[A-Za-z0-9]+$/.test(url.pathname);
    const isPageRoute = !isFileRequest && !isBackendRoute(url.pathname) && !isAdminRoute(url.pathname);

    // Handle Admin SPA routing
    if (isAdminRoute(url.pathname) && !url.pathname.match(/\.[^/]+$/)) {
      const adminUrl = new URL('/admin/index.html', request.url);
      return env.ASSETS.fetch(new Request(adminUrl, request));
    }

    if (isPageRoute) {
      const spaUrl = new URL('/index.html', request.url);
      const assetResponse = await env.ASSETS.fetch(new Request(spaUrl, request));
      return assetResponse.status === 404 ? env.ASSETS.fetch(request) : assetResponse;
    }

    return env.ASSETS.fetch(request);
  },
};