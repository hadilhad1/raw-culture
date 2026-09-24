import { demoHomepage, demoProducts } from './worker-data.js';

function isAdminRoute(pathname) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function isBackendRoute(pathname) {
  return pathname === '/api' || pathname.startsWith('/api/') || pathname === '/backend' || pathname.startsWith('/backend/');
}

function json(data, status = 200) {
  return Response.json(data, { status });
}

function demoApi(request, url) {
  const path = url.pathname.replace(/^\/backend/, '').replace(/^\/api/, '') || '/';

  if (request.method === 'GET' && path === '/products') return json(demoProducts);
  if (request.method === 'GET' && path.startsWith('/products/')) {
    const product = demoProducts.find((item) => item.id === path.split('/').pop());
    return product ? json(product) : json({ message: 'Product not found' }, 404);
  }
  if (request.method === 'GET' && path === '/content/homepage') return json(demoHomepage);
  if (request.method === 'GET' && path === '/categories') {
    return json([...new Map(demoProducts.map((product) => [product.category.slug, product.category])).values()]);
  }
  if (request.method === 'GET' && path === '/dashboard') {
    return json({ products: demoProducts.length, orders: 0, customers: 0, revenue: 0 });
  }
  if (request.method === 'GET' && (path === '/orders' || path === '/customers')) return json([]);
  if (request.method === 'POST' && path === '/auth/login') {
    return json({
      token: 'raw-culture-demo-admin-token',
      admin: { id: 'demo-admin', email: 'admin@rawculture.com', name: 'RAW-CULTURE Admin' },
    });
  }

  return json({ message: 'Demo Worker API supports catalog and admin login. Configure BACKEND_URL for database writes.' }, 501);
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
    category: { name: row.category, slug: row.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
    tags: JSON.parse(row.tags || '[]'),
    sizes: JSON.parse(row.sizes || '[]'),
    colors: JSON.parse(row.colors || '[]'),
    images,
    videos,
  };
}

function imageSetForProduct(name, category) {
  const value = `${name} ${category}`.toLowerCase();
  if (value.includes('hoodie') || value.includes('sweatshirt')) return ['/products/hoodie/front.jpg', '/products/hoodie/detail.jpg'];
  if (value.includes('cargo') || value.includes('chino') || value.includes('work pants')) return ['/products/cargo/front.jpg', '/products/cargo/detail.jpg'];
  if (value.includes('denim') || value.includes('jean')) return ['/products/denim/front.jpg', '/products/denim/detail.jpg'];
  if (value.includes('jacket') || value.includes('bomber')) return ['/products/jacket/front.jpg', '/products/jacket/detail.jpg'];
  if (value.includes('cap')) return ['/products/cap/front.jpg', '/products/cap/detail.jpg'];
  if (value.includes('belt')) return ['/products/belt/front.jpg', '/products/belt/detail.jpg'];
  if (value.includes('tote') || value.includes('bag')) return ['/products/bag/front.jpg', '/products/bag/detail.jpg'];
  if (category.toLowerCase().includes('shirt')) return ['/products/shirt/front.jpg', '/products/shirt/detail.jpg'];
  if (value.includes('sneaker') || value.includes('shoe')) return ['/products/sneakers/front.jpg', '/products/sneakers/detail.jpg'];
  return ['/products/tshirt/front.jpg', '/products/tshirt/detail.jpg'];
}

async function syncCatalogImages(db) {
  const rows = await db.prepare('SELECT id, name, category FROM products').all();
  for (const row of rows.results) {
    const images = imageSetForProduct(row.name, row.category);
    const current = await db.prepare('SELECT url FROM product_images WHERE product_id = ? ORDER BY ordering').bind(row.id).all();
    if (current.results.length === images.length && current.results.every((image, index) => image.url === images[index])) continue;
    await db.prepare('DELETE FROM product_images WHERE product_id = ?').bind(row.id).run();
    await db.batch(images.map((url, ordering) => db.prepare('INSERT INTO product_images (id, product_id, url, alt, ordering) VALUES (?, ?, ?, ?, ?)').bind(`${row.id}-catalog-${ordering}`, row.id, url, `${row.name} ${ordering ? 'detail' : 'front'}`, ordering)));
  }
}

async function ensureDatabase(db) {
  await db.batch([
    db.prepare('CREATE TABLE IF NOT EXISTS admins (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, password_hash TEXT NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, sku TEXT NOT NULL UNIQUE, description TEXT NOT NULL DEFAULT \'\', price REAL NOT NULL, sale_price REAL NOT NULL DEFAULT 0, cost_price REAL NOT NULL DEFAULT 0, stock INTEGER NOT NULL DEFAULT 0, category TEXT NOT NULL DEFAULT \'Shop\', tags TEXT NOT NULL DEFAULT \'[]\', sizes TEXT NOT NULL DEFAULT \'[]\', colors TEXT NOT NULL DEFAULT \'[]\', status TEXT NOT NULL DEFAULT \'IN_STOCK\', featured INTEGER NOT NULL DEFAULT 0, new_arrival INTEGER NOT NULL DEFAULT 0, best_seller INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)'),
    db.prepare('CREATE TABLE IF NOT EXISTS product_images (id TEXT PRIMARY KEY, product_id TEXT NOT NULL, url TEXT NOT NULL, alt TEXT NOT NULL DEFAULT \'\', ordering INTEGER NOT NULL DEFAULT 0)'),
    db.prepare('CREATE TABLE IF NOT EXISTS product_videos (id TEXT PRIMARY KEY, product_id TEXT NOT NULL, url TEXT NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS homepage_content (id INTEGER PRIMARY KEY CHECK (id = 1), hero_title TEXT NOT NULL, hero_subtitle TEXT NOT NULL, hero_button1 TEXT NOT NULL, hero_button2 TEXT NOT NULL, hero_image TEXT NOT NULL, hero_video TEXT NOT NULL, brand_story TEXT NOT NULL, newsletter_title TEXT NOT NULL, newsletter_copy TEXT NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, order_number TEXT NOT NULL UNIQUE, email TEXT NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL, shipping_address TEXT NOT NULL, items TEXT NOT NULL, subtotal REAL NOT NULL, total REAL NOT NULL, status TEXT NOT NULL DEFAULT \'PENDING\', payment_status TEXT NOT NULL DEFAULT \'PENDING\', payment_method TEXT NOT NULL DEFAULT \'cod\', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)'),
  ]);
  const count = await db.prepare('SELECT COUNT(*) AS count FROM products').first();
  if (Number(count.count) > 0) {
    await syncCatalogImages(db);
    return;
  }
  const passwordHash = await hashPassword('Admin@123');
  const statements = [db.prepare('INSERT OR IGNORE INTO admins (id, email, name, password_hash) VALUES (?, ?, ?, ?)').bind('demo-admin', 'admin@rawculture.com', 'RAW-CULTURE Admin', passwordHash)];
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
  if (request.method === 'POST' && path === '/auth/login') {
    const body = await request.json();
    const admin = await db.prepare('SELECT id, email, name, password_hash FROM admins WHERE email = ?').bind(body.email).first();
    if (!admin || admin.password_hash !== await hashPassword(body.password || '')) return Response.json({ message: 'Invalid email or password' }, { status: 401 });
    return Response.json({ token: 'raw-culture-d1-admin-token', admin: { id: admin.id, email: admin.email, name: admin.name } });
  }
  if (request.method === 'GET' && path === '/content/homepage') return Response.json(await db.prepare('SELECT hero_title AS heroTitle, hero_subtitle AS heroSubtitle, hero_button1 AS heroButton1, hero_button2 AS heroButton2, hero_image AS heroImage, hero_video AS heroVideo, brand_story AS brandStory, newsletter_title AS newsletterTitle, newsletter_copy AS newsletterCopy FROM homepage_content WHERE id = 1').first());
  if (request.method === 'GET' && path === '/products') {
    const rows = await db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
    return Response.json(await Promise.all(rows.results.map(async (row) => productFromRow(row, (await db.prepare('SELECT id, url, alt, ordering FROM product_images WHERE product_id = ? ORDER BY ordering').bind(row.id).all()).results, (await db.prepare('SELECT id, url FROM product_videos WHERE product_id = ?').bind(row.id).all()).results))));
  }
  if (request.method === 'GET' && path.startsWith('/products/')) {
    const identifier = path.split('/').pop();
    const row = await db.prepare('SELECT * FROM products WHERE id = ? OR slug = ?').bind(identifier, identifier).first();
    if (!row) return Response.json({ message: 'Product not found' }, { status: 404 });
    return Response.json(productFromRow(row, (await db.prepare('SELECT id, url, alt, ordering FROM product_images WHERE product_id = ? ORDER BY ordering').bind(row.id).all()).results, []));
  }
  if (request.method === 'POST' && path === '/orders') {
    const body = await request.json();
    if (!body.email || !body.name || !Array.isArray(body.items) || !body.items.length) return Response.json({ message: 'Name, email, and cart items are required' }, { status: 400 });
    const productRows = await db.prepare('SELECT id, price, sale_price, stock FROM products WHERE id IN (' + body.items.map(() => '?').join(',') + ')').bind(...body.items.map((item) => item.productId)).all();
    const productsById = new Map(productRows.results.map((row) => [row.id, row]));
    let calculatedTotal = 0;
    for (const item of body.items) {
      const product = productsById.get(item.productId);
      if (!product) return Response.json({ message: `Product unavailable: ${item.name}` }, { status: 400 });
      if (Number(item.quantity) < 1 || Number(item.quantity) > Number(product.stock)) return Response.json({ message: `${item.name} does not have enough stock` }, { status: 400 });
      calculatedTotal += Number(product.sale_price || product.price) * Number(item.quantity);
    }
    const orderId = `order-${crypto.randomUUID()}`;
    const orderNumber = `RC-${Date.now().toString().slice(-8)}`;
    await db.prepare('INSERT INTO orders (id, order_number, email, name, phone, shipping_address, items, subtotal, total, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(orderId, orderNumber, body.email, body.name, body.phone || '', JSON.stringify(body.shippingAddress || {}), JSON.stringify(body.items), calculatedTotal, calculatedTotal, body.paymentMethod || 'cod').run();
    return Response.json({ id: orderId, orderNumber, status: 'PENDING', paymentStatus: 'PENDING', total: calculatedTotal }, { status: 201 });
  }
  if (request.method === 'GET' && path === '/orders') {
    const result = await db.prepare('SELECT id, order_number AS orderNumber, email, name, phone, total, status, payment_status AS paymentStatus, created_at AS createdAt FROM orders ORDER BY created_at DESC').all();
    return Response.json(result.results);
  }
  if (request.method === 'GET' && path.startsWith('/orders/')) {
    const order = await db.prepare('SELECT id, order_number AS orderNumber, email, name, phone, shipping_address AS shippingAddress, items, total, status, payment_status AS paymentStatus, payment_method AS paymentMethod, created_at AS createdAt FROM orders WHERE id = ? OR order_number = ?').bind(path.split('/').pop(), path.split('/').pop()).first();
    return order ? Response.json({ ...order, items: JSON.parse(order.items), shippingAddress: JSON.parse(order.shippingAddress) }) : Response.json({ message: 'Order not found' }, { status: 404 });
  }
  if (request.method === 'PATCH' && path.match(/^\/orders\/[^/]+\/status$/)) {
    const allowed = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    const body = await request.json();
    if (!allowed.includes(body.status)) return Response.json({ message: 'Invalid order status' }, { status: 400 });
    await db.prepare('UPDATE orders SET status = ? WHERE id = ? OR order_number = ?').bind(body.status, path.split('/')[2], path.split('/')[2]).run();
    return Response.json({ success: true, status: body.status });
  }
  if (request.method === 'POST' || request.method === 'PUT') {
    const body = await request.json();
    const id = path.startsWith('/products/') ? path.split('/').pop() : `product-${crypto.randomUUID()}`;
    const slug = String(body.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const values = [id, body.name, slug, body.sku, body.description || '', Number(body.price), Number(body.salePrice || body.price), Number(body.costPrice || 0), Number(body.stock || 0), body.categories?.[0] || body.category || 'Shop', JSON.stringify(body.tags || []), JSON.stringify(body.sizes || []), JSON.stringify(body.colors || []), body.status || 'IN_STOCK', Number(Boolean(body.featured)), Number(Boolean(body.newArrival)), Number(Boolean(body.bestSeller))];
    await db.prepare('INSERT OR REPLACE INTO products (id, name, slug, sku, description, price, sale_price, cost_price, stock, category, tags, sizes, colors, status, featured, new_arrival, best_seller, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)').bind(...values).run();
    await db.prepare('DELETE FROM product_images WHERE product_id = ?').bind(id).run();
    for (const [ordering, image] of (body.imageUrls || []).map((urlValue, index) => [index, urlValue])) await db.prepare('INSERT INTO product_images (id, product_id, url, alt, ordering) VALUES (?, ?, ?, ?, ?)').bind(`${id}-image-${ordering}`, id, image, body.name || 'Product', ordering).run();
    return Response.json({ id });
  }
  return Response.json({ message: 'Unsupported API operation' }, { status: 405 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (isBackendRoute(url.pathname)) {
      if (env.raw_culture_db) return databaseApi(request, url, env.raw_culture_db);
      if (!env.BACKEND_URL) {
        return demoApi(request, url);
      }

      const backendPath = url.pathname.startsWith('/backend')
        ? url.pathname.slice('/backend'.length) || '/'
        : url.pathname;
      const backendUrl = new URL(`${backendPath}${url.search}`, env.BACKEND_URL);
      return fetch(new Request(backendUrl, request));
    }

    if (isAdminRoute(url.pathname) && !url.pathname.match(/\.[^/]+$/)) {
      const adminUrl = new URL('/admin/index.html', request.url);
      return env.ASSETS.fetch(new Request(adminUrl, request));
    }

    return env.ASSETS.fetch(request);
  },
};