import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'raw-culture-dev-secret';
const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('CORS not allowed'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token' });
  }

  try {
    const token = header.replace('Bearer ', '');
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

function parseList(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function serializeList(value) {
  if (!value) return '';
  return Array.isArray(value) ? value.join(',') : String(value);
}

function normalizeProduct(product) {
  return {
    ...product,
    tags: parseList(product.tags),
    sizes: parseList(product.sizes),
    colors: parseList(product.colors),
    images: product.images || [],
    videos: product.videos || [],
  };
}

function buildSlug(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'product';
}

app.get('/api/health', async (req, res) => {
  res.json({ status: 'ok', service: 'raw-culture-api' });
});

app.get('/api/categories', async (req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { createdAt: 'asc' } });
  res.json(categories);
});

app.post('/api/categories', authMiddleware, async (req, res) => {
  const { name, slug, description, imageUrl } = req.body;
  if (!name) return res.status(400).json({ message: 'Category name is required' });

  const category = await prisma.category.create({
    data: {
      name,
      slug: slug || buildSlug(name),
      description: description || '',
      imageUrl: imageUrl || '',
    }
  });

  res.status(201).json(category);
});

app.put('/api/categories/:id', authMiddleware, async (req, res) => {
  const { name, slug, description, imageUrl } = req.body;
  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: {
      name,
      slug: slug || buildSlug(name),
      description,
      imageUrl,
    }
  });
  res.json(category);
});

app.delete('/api/categories/:id', authMiddleware, async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

app.get('/api/products', async (req, res) => {
  const { category, featured, bestseller, search } = req.query;

  const products = await prisma.product.findMany({
    include: {
      category: true,
      images: { orderBy: { ordering: 'asc' } },
      videos: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  const filtered = products.filter((product) => {
    const matchesCategory = !category || product.category?.slug === category || product.category?.name === category;
    const matchesFeatured = featured === undefined || featured === null || featured === 'false' || product.featured === (featured === 'true');
    const matchesBestSeller = bestseller === undefined || bestseller === null || bestseller === 'false' || product.bestSeller === (bestseller === 'true');
    const searchValue = String(search || '').toLowerCase();
    const matchesSearch = !searchValue || `${product.name} ${product.description} ${product.tags || ''}`.toLowerCase().includes(searchValue);
    return matchesCategory && matchesFeatured && matchesBestSeller && matchesSearch;
  });

  res.json(filtered.map(normalizeProduct));
});

app.get('/api/products/:id', async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      category: true,
      images: { orderBy: { ordering: 'asc' } },
      videos: true,
    }
  });

  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(normalizeProduct(product));
});

app.post('/api/products', authMiddleware, async (req, res) => {
  const { name, sku, description, price, compareAtPrice, salePrice, stock, categories, tags, sizes, colors, status, featured, newArrival, bestSeller, imageUrls = [], videoUrls = [] } = req.body;

  if (!name || !sku || !price) {
    return res.status(400).json({ message: 'Product name, SKU, and price are required' });
  }

  const categorySlug = Array.isArray(categories) && categories[0] ? categories[0] : 't-shirts';
  const category = await prisma.category.findFirst({ where: { slug: categorySlug } }) || await prisma.category.findFirst();

  const product = await prisma.product.create({
    data: {
      name,
      slug: `${buildSlug(name)}-${Date.now()}`,
      sku,
      description: description || '',
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      salePrice: salePrice ? Number(salePrice) : null,
      costPrice: salePrice ? Number(salePrice) * 0.6 : 0,
      stock: Number(stock || 0),
      tags: serializeList(tags || []),
      sizes: serializeList(sizes || []),
      colors: serializeList(colors || []),
      status: status || 'IN_STOCK',
      featured: Boolean(featured),
      newArrival: Boolean(newArrival),
      bestSeller: Boolean(bestSeller),
      categoryId: category ? category.id : null,
      images: {
        create: (imageUrls || []).slice(0, 4).map((url, index) => ({ url, alt: name, ordering: index }))
      },
      videos: {
        create: (videoUrls || []).slice(0, 2).map((url) => ({ url }))
      }
    },
    include: { images: true, videos: true, category: true }
  });

  res.status(201).json(normalizeProduct(product));
});

app.put('/api/products/:id', authMiddleware, async (req, res) => {
  const { name, sku, description, price, compareAtPrice, salePrice, stock, categories, tags, sizes, colors, status, featured, newArrival, bestSeller, imageUrls = [], videoUrls = [] } = req.body;

  const categorySlug = Array.isArray(categories) && categories[0] ? categories[0] : undefined;
  const category = categorySlug ? await prisma.category.findFirst({ where: { slug: categorySlug } }) : null;

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      name: name || undefined,
      sku: sku || undefined,
      description: description || undefined,
      price: price !== undefined ? Number(price) : undefined,
      compareAtPrice: compareAtPrice !== undefined ? Number(compareAtPrice) : undefined,
      salePrice: salePrice !== undefined ? Number(salePrice) : undefined,
      stock: stock !== undefined ? Number(stock) : undefined,
      tags: tags ? serializeList(tags) : undefined,
      sizes: sizes ? serializeList(sizes) : undefined,
      colors: colors ? serializeList(colors) : undefined,
      status: status || undefined,
      featured: featured !== undefined ? Boolean(featured) : undefined,
      newArrival: newArrival !== undefined ? Boolean(newArrival) : undefined,
      bestSeller: bestSeller !== undefined ? Boolean(bestSeller) : undefined,
      categoryId: category ? category.id : undefined,
      ...(imageUrls.length ? { images: { deleteMany: {}, create: imageUrls.slice(0, 4).map((url, index) => ({ url, alt: name || 'Product', ordering: index })) } } : {}),
      ...(videoUrls.length ? { videos: { deleteMany: {}, create: videoUrls.slice(0, 2).map((url) => ({ url })) } } : {})
    },
    include: { images: true, videos: true, category: true }
  });

  res.json(normalizeProduct(product));
});

app.delete('/api/products/:id', authMiddleware, async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

app.get('/api/content/homepage', async (req, res) => {
  const content = await prisma.homepageContent.findFirst();
  res.json(content || {
    heroTitle: 'RAW-CULTURE',
    heroSubtitle: 'Premium streetwear for the next generation.',
    heroButton1: 'Shop Men',
    heroButton2: 'Shop Women',
    heroImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1600&q=80',
    heroVideo: 'https://videos.pexels.com/video-files/6487458/6487458-hd_1920_1080.mp4',
    brandStory: 'RAW-CULTURE blends modern staples with urban confidence and elevated everyday essentials.',
    newsletterTitle: 'Join the RAW-CULTURE list',
    newsletterCopy: 'Early access to drops, culture notes, and private offers.'
  });
});

app.put('/api/content/homepage', authMiddleware, async (req, res) => {
  const existing = await prisma.homepageContent.findFirst();
  const content = existing
    ? await prisma.homepageContent.update({ where: { id: existing.id }, data: req.body })
    : await prisma.homepageContent.create({ data: req.body });
  res.json(content);
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const admin = await prisma.admin.findUnique({ where: { email } });

  if (!admin) return res.status(401).json({ message: 'Invalid email or password' });
  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) return res.status(401).json({ message: 'Invalid email or password' });

  const token = jwt.sign({ id: admin.id, email: admin.email, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, admin: { id: admin.id, email: admin.email, name: admin.name } });
});

app.get('/api/dashboard', async (req, res) => {
  const [products, orders, users] = await Promise.all([
    prisma.product.findMany(),
    prisma.order.findMany(),
    prisma.user.findMany(),
  ]);

  const totalSales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  res.json({
    totalSales,
    todaysSales: 0,
    totalOrders: orders.length,
    totalCustomers: users.length,
    totalProducts: products.length,
    lowStockProducts: products.filter((product) => product.stock < 10).length,
    pendingOrders: orders.filter((order) => order.status === 'PENDING').length,
    processingOrders: orders.filter((order) => order.status === 'PROCESSING').length,
    deliveredOrders: orders.filter((order) => order.status === 'DELIVERED').length,
    cancelledOrders: orders.filter((order) => order.status === 'CANCELLED').length,
  });
});

app.get('/api/orders', async (req, res) => {
  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(orders.map((order) => ({
    ...order,
    shippingAddress: order.shippingAddress ? JSON.parse(order.shippingAddress) : {},
  })));
});

app.get('/api/orders/:id', async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true } });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json({ ...order, shippingAddress: order.shippingAddress ? JSON.parse(order.shippingAddress) : {} });
});

app.put('/api/orders/:id/status', authMiddleware, async (req, res) => {
  const { status, trackingNumber, shippingProvider, notes } = req.body;
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status, trackingNumber, shippingProvider, notes },
    include: { items: true }
  });

  res.json({ ...order, shippingAddress: order.shippingAddress ? JSON.parse(order.shippingAddress) : {} });
});

app.get('/api/customers', async (req, res) => {
  const customers = await prisma.user.findMany({
    include: { orders: true },
    orderBy: { createdAt: 'desc' }
  });

  res.json(customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    orders: customer.orders.length,
    totalSpending: customer.orders.reduce((sum, order) => sum + Number(order.total || 0), 0),
    lastOrder: customer.orders[0]?.createdAt || null,
  })));
});

app.post('/api/orders', async (req, res) => {
  const { email, phone, name, items, shippingAddress, total } = req.body;
  const customer = await prisma.user.upsert({
    where: { email },
    update: { name, phone },
    create: { email, name, phone, role: 'CUSTOMER' },
  });

  const order = await prisma.order.create({
    data: {
      userId: customer.id,
      email,
      phone,
      orderNumber: `RC-${Date.now()}`,
      status: 'PENDING',
      paymentStatus: 'PAID',
      subtotal: Number(total),
      shippingFee: 0,
      discount: 0,
      total: Number(total),
      shippingAddress: JSON.stringify(shippingAddress || {}),
      items: {
        create: (items || []).map((item) => ({
          productId: item.productId,
          name: item.name,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: Number(item.price),
        }))
      }
    },
    include: { items: true }
  });

  res.status(201).json(order);
});

app.listen(PORT, () => {
  console.log(`RAW-CULTURE backend running on http://localhost:${PORT}`);
});
