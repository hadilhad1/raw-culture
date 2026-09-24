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

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:4173',
  'http://localhost:4174',
  'http://localhost:5173',
  ...(process.env.CORS_ORIGIN || '').split(',').map((origin) => origin.trim()).filter(Boolean),
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.workers.dev') || origin.includes('localhost')) {
      callback(null, true);
      return;
    }
    callback(null, true); // Permissive for preview/worker environments while retaining credentials
  },
  credentials: true,
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid authorization token' });
  }

  try {
    const token = header.replace('Bearer ', '');
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Session expired or invalid token' });
  }
}

function parseList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function serializeList(value) {
  if (!value) return '';
  return Array.isArray(value) ? value.join(',') : String(value);
}

function buildSlug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'item';
}

function normalizeProduct(product) {
  return {
    ...product,
    tags: parseList(product.tags),
    sizes: parseList(product.sizes),
    colors: parseList(product.colors),
    images: product.images || [],
    videos: product.videos || [],
    category: product.category || { name: 'Unassigned', slug: 'unassigned' },
    collection: product.collection || null,
  };
}

// Ensure initial seed for default models if missing
async function ensureInitialData() {
  try {
    const couponCount = await prisma.coupon.count();
    if (couponCount === 0) {
      await prisma.coupon.createMany({
        data: [
          { code: 'RAW10', discountType: 'PERCENTAGE', discountValue: 10, minOrderAmount: 200, maxUses: 500, isActive: true },
          { code: 'STREET50', discountType: 'FIXED', discountValue: 50, minOrderAmount: 300, maxUses: 200, isActive: true },
          { code: 'VIP20', discountType: 'PERCENTAGE', discountValue: 20, minOrderAmount: 1000, maxUses: 100, isActive: true },
        ],
      });
    }

    const videoCount = await prisma.videoAsset.count();
    if (videoCount === 0) {
      await prisma.videoAsset.createMany({
        data: [
          {
            title: 'RAW-CULTURE 2026 Movement Film',
            url: 'https://videos.pexels.com/video-files/6487458/6487458-hd_1920_1080.mp4',
            thumbnail: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1400&q=80',
            isActive: true,
          },
          {
            title: 'Urban Streetwear Walkthrough',
            url: 'https://cdn.coverr.co/videos/coverr-man-walking-in-a-city-1562117187740/1080p.mp4',
            thumbnail: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1400&q=80',
            isActive: true,
          },
        ],
      });
    }

    const mediaCount = await prisma.mediaAsset.count();
    if (mediaCount === 0) {
      await prisma.mediaAsset.createMany({
        data: [
          { name: 'Core Black Tee - Front', url: '/products/tshirt/front.jpg', type: 'image' },
          { name: 'Core Black Tee - Detail', url: '/products/tshirt/detail.jpg', type: 'image' },
          { name: 'Essential Hoodie - Front', url: '/products/hoodie/front.jpg', type: 'image' },
          { name: 'Essential Hoodie - Detail', url: '/products/hoodie/detail.jpg', type: 'image' },
          { name: 'Urban Cargo - Front', url: '/products/cargo/front.jpg', type: 'image' },
          { name: 'Urban Cargo - Detail', url: '/products/cargo/detail.jpg', type: 'image' },
          { name: 'Street Utility Jacket - Front', url: '/products/jacket/front.jpg', type: 'image' },
          { name: 'Monarch Cap - Front', url: '/products/cap/front.jpg', type: 'image' },
        ],
      });
    }

    const setting = await prisma.storeSetting.findUnique({ where: { id: 'default' } });
    if (!setting) {
      await prisma.storeSetting.create({
        data: {
          id: 'default',
          storeName: 'RAW-CULTURE',
          currency: 'INR',
          supportEmail: 'support@rawculture.com',
          phone: '+91 98765 43210',
          address: 'Mumbai, India',
        },
      });
    }
  } catch (err) {
    console.error('Error ensuring initial seed data:', err.message);
  }
}
ensureInitialData();

// ==========================================
// 1. HEALTH & AUTH
// ==========================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'raw-culture-api', timestamp: new Date().toISOString() });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    if (!admin) {
      return res.status(404).json({ message: 'Admin user not found' });
    }
    res.json({ admin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 2. DASHBOARD
// ==========================================

app.get('/api/dashboard', async (req, res) => {
  try {
    const [products, orders, users] = await Promise.all([
      prisma.product.findMany({
        include: { category: true, images: { take: 1, orderBy: { ordering: 'asc' } } },
      }),
      prisma.order.findMany({
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.findMany({
        include: { orders: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const activeOrders = orders.filter((o) => o.status !== 'CANCELLED');
    const totalSales = activeOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysOrders = activeOrders.filter((o) => new Date(o.createdAt) >= today);
    const todaysSales = todaysOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthOrders = activeOrders.filter((o) => new Date(o.createdAt) >= monthAgo);
    const monthlySales = monthOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

    // Group sales by month (last 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const salesByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthTotal = activeOrders
        .filter((o) => {
          const od = new Date(o.createdAt);
          return od.getMonth() === m && od.getFullYear() === y;
        })
        .reduce((sum, o) => sum + Number(o.total || 0), 0);

      salesByMonth.push({
        month: monthNames[m],
        sales: monthTotal,
      });
    }

    res.json({
      totalSales,
      todaysSales,
      monthlySales,
      totalOrders: orders.length,
      totalCustomers: users.length,
      totalProducts: products.length,
      lowStockProducts: products.filter((p) => p.stock < 10).length,
      outOfStockProducts: products.filter((p) => p.stock === 0).length,
      pendingOrders: orders.filter((o) => o.status === 'PENDING').length,
      confirmedOrders: orders.filter((o) => o.status === 'CONFIRMED').length,
      processingOrders: orders.filter((o) => o.status === 'PROCESSING').length,
      shippedOrders: orders.filter((o) => o.status === 'SHIPPED').length,
      deliveredOrders: orders.filter((o) => o.status === 'DELIVERED').length,
      cancelledOrders: orders.filter((o) => o.status === 'CANCELLED').length,
      salesByMonth,
      recentOrders: orders.slice(0, 10).map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.name || o.email,
        email: o.email,
        phone: o.phone,
        total: o.total,
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod || 'cod',
        itemsCount: o.items.length,
        createdAt: o.createdAt,
      })),
      recentCustomers: users.slice(0, 5).map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        ordersCount: u.orders.length,
        totalSpent: u.orders.reduce((sum, o) => sum + Number(o.total || 0), 0),
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 3. CATEGORIES
// ==========================================

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(
      categories.map((c) => ({
        ...c,
        productCount: c._count.products,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/categories', authMiddleware, async (req, res) => {
  try {
    const { name, slug, description, imageUrl } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required' });

    const targetSlug = slug || buildSlug(name);
    const existing = await prisma.category.findUnique({ where: { slug: targetSlug } });
    if (existing) {
      return res.status(400).json({ message: 'A category with this slug already exists' });
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug: targetSlug,
        description: description || '',
        imageUrl: imageUrl || '',
      },
      include: {
        _count: { select: { products: true } },
      },
    });

    res.status(201).json({ ...category, productCount: 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/categories/:id', authMiddleware, async (req, res) => {
  try {
    const { name, slug, description, imageUrl } = req.body;
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        name: name || undefined,
        slug: slug ? buildSlug(slug) : undefined,
        description: description !== undefined ? description : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
      },
      include: {
        _count: { select: { products: true } },
      },
    });
    res.json({ ...category, productCount: category._count.products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/categories/:id', authMiddleware, async (req, res) => {
  try {
    // Unlink products assigned to this category
    await prisma.product.updateMany({
      where: { categoryId: req.params.id },
      data: { categoryId: null },
    });
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 4. COLLECTIONS
// ==========================================

app.get('/api/collections', async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      collections.map((c) => ({
        ...c,
        productCount: c._count.products,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/collections', authMiddleware, async (req, res) => {
  try {
    const { name, slug, description, imageUrl, isActive } = req.body;
    if (!name) return res.status(400).json({ message: 'Collection name is required' });

    const targetSlug = slug || buildSlug(name);
    const existing = await prisma.collection.findUnique({ where: { slug: targetSlug } });
    if (existing) {
      return res.status(400).json({ message: 'A collection with this slug already exists' });
    }

    const collection = await prisma.collection.create({
      data: {
        name,
        slug: targetSlug,
        description: description || '',
        imageUrl: imageUrl || '',
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
      include: {
        _count: { select: { products: true } },
      },
    });

    res.status(201).json({ ...collection, productCount: 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/collections/:id', authMiddleware, async (req, res) => {
  try {
    const { name, slug, description, imageUrl, isActive } = req.body;
    const collection = await prisma.collection.update({
      where: { id: req.params.id },
      data: {
        name: name || undefined,
        slug: slug ? buildSlug(slug) : undefined,
        description: description !== undefined ? description : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
      include: {
        _count: { select: { products: true } },
      },
    });
    res.json({ ...collection, productCount: collection._count.products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/collections/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.product.updateMany({
      where: { collectionId: req.params.id },
      data: { collectionId: null },
    });
    await prisma.collection.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Collection deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 5. PRODUCTS
// ==========================================

app.get('/api/products', async (req, res) => {
  try {
    const { category, collection, featured, bestseller, newarrival, status, search } = req.query;

    const products = await prisma.product.findMany({
      include: {
        category: true,
        collection: true,
        images: { orderBy: { ordering: 'asc' } },
        videos: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const filtered = products.filter((product) => {
      const matchesCategory =
        !category ||
        product.category?.slug === category ||
        product.category?.name?.toLowerCase() === String(category).toLowerCase();

      const matchesCollection =
        !collection ||
        product.collection?.slug === collection ||
        product.collection?.name?.toLowerCase() === String(collection).toLowerCase();

      const matchesFeatured =
        featured === undefined || featured === null || featured === ''
          ? true
          : product.featured === (featured === 'true' || featured === true);

      const matchesBestSeller =
        bestseller === undefined || bestseller === null || bestseller === ''
          ? true
          : product.bestSeller === (bestseller === 'true' || bestseller === true);

      const matchesNewArrival =
        newarrival === undefined || newarrival === null || newarrival === ''
          ? true
          : product.newArrival === (newarrival === 'true' || newarrival === true);

      const matchesStatus = !status || product.status === status;

      const searchValue = String(search || '').toLowerCase().trim();
      const matchesSearch =
        !searchValue ||
        `${product.name} ${product.sku} ${product.description} ${product.tags || ''} ${product.category?.name || ''}`
          .toLowerCase()
          .includes(searchValue);

      return (
        matchesCategory &&
        matchesCollection &&
        matchesFeatured &&
        matchesBestSeller &&
        matchesNewArrival &&
        matchesStatus &&
        matchesSearch
      );
    });

    res.json(filtered.map(normalizeProduct));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }, { sku: id }],
      },
      include: {
        category: true,
        collection: true,
        images: { orderBy: { ordering: 'asc' } },
        videos: true,
      },
    });

    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(normalizeProduct(product));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/products', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      sku,
      description,
      price,
      compareAtPrice,
      salePrice,
      costPrice,
      stock,
      category: categoryParam,
      categories,
      collection: collectionParam,
      tags,
      sizes,
      colors,
      status,
      featured,
      newArrival,
      bestSeller,
      imageUrls = [],
      videoUrls = [],
    } = req.body;

    if (!name || !sku || price === undefined || price === null || price === '') {
      return res.status(400).json({ message: 'Product name, SKU, and price are required' });
    }

    const existingSku = await prisma.product.findUnique({ where: { sku } });
    if (existingSku) {
      return res.status(400).json({ message: `A product with SKU "${sku}" already exists` });
    }

    // Resolve category
    const catSlugOrId = categoryParam || (Array.isArray(categories) ? categories[0] : null);
    let category = null;
    if (catSlugOrId) {
      category = await prisma.category.findFirst({
        where: { OR: [{ id: catSlugOrId }, { slug: catSlugOrId }, { name: catSlugOrId }] },
      });
    }
    if (!category) {
      category = await prisma.category.findFirst();
    }

    // Resolve collection
    let collection = null;
    if (collectionParam) {
      collection = await prisma.collection.findFirst({
        where: { OR: [{ id: collectionParam }, { slug: collectionParam }, { name: collectionParam }] },
      });
    }

    const stockNum = Number(stock || 0);
    const resolvedStatus = status || (stockNum === 0 ? 'OUT_OF_STOCK' : stockNum < 10 ? 'LOW_STOCK' : 'IN_STOCK');
    const slug = `${buildSlug(name)}-${Date.now().toString().slice(-4)}`;

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        sku,
        description: description || '',
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
        salePrice: salePrice ? Number(salePrice) : null,
        costPrice: costPrice ? Number(costPrice) : Number(price) * 0.45,
        stock: stockNum,
        tags: serializeList(tags || []),
        sizes: serializeList(sizes || ['S', 'M', 'L', 'XL']),
        colors: serializeList(colors || ['Black']),
        status: resolvedStatus,
        featured: Boolean(featured),
        newArrival: Boolean(newArrival),
        bestSeller: Boolean(bestSeller),
        categoryId: category ? category.id : null,
        collectionId: collection ? collection.id : null,
        images: {
          create: (imageUrls || []).map((url, index) => ({
            url,
            alt: `${name} image ${index + 1}`,
            ordering: index,
          })),
        },
        videos: {
          create: (videoUrls || []).map((url) => ({ url })),
        },
      },
      include: {
        images: { orderBy: { ordering: 'asc' } },
        videos: true,
        category: true,
        collection: true,
      },
    });

    res.status(201).json(normalizeProduct(product));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/products/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      sku,
      description,
      price,
      compareAtPrice,
      salePrice,
      costPrice,
      stock,
      category: categoryParam,
      categories,
      collection: collectionParam,
      tags,
      sizes,
      colors,
      status,
      featured,
      newArrival,
      bestSeller,
      imageUrls,
      videoUrls,
    } = req.body;

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (sku && sku !== existingProduct.sku) {
      const skuCheck = await prisma.product.findUnique({ where: { sku } });
      if (skuCheck) return res.status(400).json({ message: `SKU "${sku}" is already in use` });
    }

    let categoryId = undefined;
    const catSlugOrId = categoryParam || (Array.isArray(categories) ? categories[0] : null);
    if (catSlugOrId) {
      const cat = await prisma.category.findFirst({
        where: { OR: [{ id: catSlugOrId }, { slug: catSlugOrId }, { name: catSlugOrId }] },
      });
      if (cat) categoryId = cat.id;
    }

    let collectionId = undefined;
    if (collectionParam !== undefined) {
      if (collectionParam === '' || collectionParam === null) {
        collectionId = null;
      } else {
        const col = await prisma.collection.findFirst({
          where: { OR: [{ id: collectionParam }, { slug: collectionParam }, { name: collectionParam }] },
        });
        if (col) collectionId = col.id;
      }
    }

    const stockNum = stock !== undefined ? Number(stock) : undefined;
    let resolvedStatus = status;
    if (!resolvedStatus && stockNum !== undefined) {
      resolvedStatus = stockNum === 0 ? 'OUT_OF_STOCK' : stockNum < 10 ? 'LOW_STOCK' : 'IN_STOCK';
    }

    const updateData = {
      name: name || undefined,
      sku: sku || undefined,
      description: description !== undefined ? description : undefined,
      price: price !== undefined ? Number(price) : undefined,
      compareAtPrice: compareAtPrice !== undefined ? (compareAtPrice ? Number(compareAtPrice) : null) : undefined,
      salePrice: salePrice !== undefined ? (salePrice ? Number(salePrice) : null) : undefined,
      costPrice: costPrice !== undefined ? (costPrice ? Number(costPrice) : null) : undefined,
      stock: stockNum,
      tags: tags !== undefined ? serializeList(tags) : undefined,
      sizes: sizes !== undefined ? serializeList(sizes) : undefined,
      colors: colors !== undefined ? serializeList(colors) : undefined,
      status: resolvedStatus || undefined,
      featured: featured !== undefined ? Boolean(featured) : undefined,
      newArrival: newArrival !== undefined ? Boolean(newArrival) : undefined,
      bestSeller: bestSeller !== undefined ? Boolean(bestSeller) : undefined,
      categoryId,
      collectionId,
    };

    if (Array.isArray(imageUrls)) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
      updateData.images = {
        create: imageUrls.map((url, index) => ({
          url,
          alt: `${name || existingProduct.name} ${index + 1}`,
          ordering: index,
        })),
      };
    }

    if (Array.isArray(videoUrls)) {
      await prisma.productVideo.deleteMany({ where: { productId: id } });
      updateData.videos = {
        create: videoUrls.map((url) => ({ url })),
      };
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        images: { orderBy: { ordering: 'asc' } },
        videos: true,
        category: true,
        collection: true,
      },
    });

    res.json(normalizeProduct(updated));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/products/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    // Check if product exists
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Clean relations
    await prisma.productImage.deleteMany({ where: { productId: id } });
    await prisma.productVideo.deleteMany({ where: { productId: id } });
    await prisma.wishlistItem.deleteMany({ where: { productId: id } });

    await prisma.product.delete({ where: { id } });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch('/api/products/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid product status' });
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { status },
      include: { images: true, category: true },
    });

    res.json(normalizeProduct(product));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 6. INVENTORY
// ==========================================

app.get('/api/inventory', async (req, res) => {
  try {
    const [products, orderItems] = await Promise.all([
      prisma.product.findMany({
        include: {
          category: true,
          images: { take: 1, orderBy: { ordering: 'asc' } },
        },
        orderBy: { stock: 'asc' },
      }),
      prisma.orderItem.findMany({
        where: { order: { status: { not: 'CANCELLED' } } },
        select: { productId: true, quantity: true },
      }),
    ]);

    // Calculate sold count per product
    const soldMap = {};
    for (const item of orderItems) {
      soldMap[item.productId] = (soldMap[item.productId] || 0) + Number(item.quantity || 0);
    }

    const inventoryList = products.map((product) => {
      const sold = soldMap[product.id] || 0;
      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category?.name || 'Unassigned',
        price: product.price,
        stock: product.stock,
        soldQuantity: sold,
        status: product.status,
        lowStockWarning: product.stock > 0 && product.stock < 10,
        outOfStock: product.stock === 0,
        image: product.images?.[0]?.url || null,
        updatedAt: product.updatedAt,
      };
    });

    res.json(inventoryList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const handleInventoryUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, status } = req.body;

    if (stock === undefined || stock === null) {
      return res.status(400).json({ message: 'Stock value is required' });
    }

    const stockNum = Math.max(0, parseInt(stock, 10));
    const resolvedStatus = status || (stockNum === 0 ? 'OUT_OF_STOCK' : stockNum < 10 ? 'LOW_STOCK' : 'IN_STOCK');

    const updated = await prisma.product.update({
      where: { id },
      data: {
        stock: stockNum,
        status: resolvedStatus,
      },
      include: {
        category: true,
        images: { take: 1, orderBy: { ordering: 'asc' } },
      },
    });

    res.json({
      id: updated.id,
      name: updated.name,
      sku: updated.sku,
      stock: updated.stock,
      status: updated.status,
      message: 'Stock updated successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

app.put('/api/inventory/:id', authMiddleware, handleInventoryUpdate);
app.patch('/api/inventory/:id', authMiddleware, handleInventoryUpdate);

// ==========================================
// 7. ORDERS & CHECKOUT
// ==========================================

app.get('/api/orders', async (req, res) => {
  try {
    const { status, search } = req.query;

    const orders = await prisma.order.findMany({
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const parsedOrders = orders.map((order) => {
      let shippingAddress = {};
      try {
        shippingAddress = order.shippingAddress ? JSON.parse(order.shippingAddress) : {};
      } catch (e) {
        shippingAddress = { line1: order.shippingAddress || '' };
      }

      return {
        ...order,
        shippingAddress,
        items: order.items.map((item) => ({
          ...item,
          sku: item.sku || 'N/A',
          size: item.size || 'Standard',
          color: item.color || 'Standard',
          image: item.image || null,
        })),
      };
    });

    const filtered = parsedOrders.filter((order) => {
      const matchesStatus = !status || order.status === status;
      const q = String(search || '').toLowerCase().trim();
      const matchesSearch =
        !q ||
        order.orderNumber.toLowerCase().includes(q) ||
        (order.name || '').toLowerCase().includes(q) ||
        (order.email || '').toLowerCase().includes(q) ||
        (order.phone || '').toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, category: { select: { name: true } } },
            },
          },
        },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });

    let shippingAddress = {};
    try {
      shippingAddress = order.shippingAddress ? JSON.parse(order.shippingAddress) : {};
    } catch {
      shippingAddress = { line1: order.shippingAddress || '' };
    }

    res.json({
      ...order,
      shippingAddress,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        sku: item.sku || item.product?.sku || 'RC-ITEM',
        category: item.product?.category?.name || 'Streetwear',
        price: item.price,
        quantity: item.quantity,
        total: Number((item.price * item.quantity).toFixed(2)),
        size: item.size || 'Standard',
        color: item.color || 'Standard',
        image: item.image || null,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const {
      email,
      name,
      phone,
      shippingAddress,
      items,
      total: reqTotal,
      subtotal: reqSubtotal,
      shippingFee: reqShippingFee,
      discount: reqDiscount,
      couponCode,
      paymentMethod = 'cod',
    } = req.body;

    if (!email || !name || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Customer name, email, and at least one item are required' });
    }

    // Verify stock and fetch fresh pricing
    const productIds = items.map((i) => i.productId).filter(Boolean);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { images: { take: 1, orderBy: { ordering: 'asc' } }, category: true },
    });
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let calculatedSubtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return res.status(400).json({ message: `Product unavailable: ${item.name || 'Item'}` });
      }

      const qty = Math.max(1, parseInt(item.quantity, 10));
      if (product.stock < qty) {
        return res.status(400).json({
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${qty}`,
        });
      }

      const unitPrice = Number(product.salePrice || product.price);
      calculatedSubtotal += unitPrice * qty;

      verifiedItems.push({
        productId: product.id,
        name: product.name,
        sku: item.sku || product.sku,
        image: item.image || product.images?.[0]?.url || '',
        size: item.size || 'Standard',
        color: item.color || 'Standard',
        quantity: qty,
        price: unitPrice,
      });
    }

    // Validate coupon if provided
    let calculatedDiscount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: String(couponCode).toUpperCase() },
      });
      if (coupon && coupon.isActive) {
        const notExpired = !coupon.expiresAt || new Date(coupon.expiresAt) > new Date();
        const underLimit = !coupon.maxUses || coupon.usedCount < coupon.maxUses;
        const meetsMin = calculatedSubtotal >= coupon.minOrderAmount;

        if (notExpired && underLimit && meetsMin) {
          calculatedDiscount =
            coupon.discountType === 'PERCENTAGE'
              ? (calculatedSubtotal * coupon.discountValue) / 100
              : Math.min(coupon.discountValue, calculatedSubtotal);

          await prisma.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          });
        }
      }
    }

    const shippingFee = calculatedSubtotal > 200 ? 0 : Number(reqShippingFee || 0);
    const finalTotal = Math.max(0, calculatedSubtotal - calculatedDiscount + shippingFee);

    // Upsert customer record
    const customer = await prisma.user.upsert({
      where: { email },
      update: { name, phone: phone || undefined },
      create: { email, name, phone, role: 'CUSTOMER' },
    });

    const orderNumber = `RC-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;
    const fullAddressSnapshot = {
      name,
      email,
      phone: phone || '',
      line1: shippingAddress?.line1 || shippingAddress?.address || '',
      line2: shippingAddress?.line2 || '',
      city: shippingAddress?.city || '',
      state: shippingAddress?.state || '',
      postalCode: shippingAddress?.postalCode || '',
      country: shippingAddress?.country || 'India',
    };

    const order = await prisma.order.create({
      data: {
        userId: customer.id,
        email,
        name,
        phone: phone || '',
        orderNumber,
        status: 'PENDING',
        paymentStatus: paymentMethod === 'online' ? 'PAID' : 'PENDING',
        paymentMethod: paymentMethod || 'cod',
        subtotal: calculatedSubtotal,
        shippingFee,
        discount: calculatedDiscount,
        total: finalTotal,
        shippingAddress: JSON.stringify(fullAddressSnapshot),
        items: {
          create: verifiedItems.map((item) => ({
            productId: item.productId,
            name: item.name,
            sku: item.sku,
            image: item.image,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { items: true },
    });

    // Decrement stock for ordered items
    for (const item of verifiedItems) {
      const remainingStock = Math.max(0, (productMap.get(item.productId)?.stock || 0) - item.quantity);
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: remainingStock,
          status: remainingStock === 0 ? 'OUT_OF_STOCK' : remainingStock < 10 ? 'LOW_STOCK' : 'IN_STOCK',
        },
      });
    }

    res.status(201).json({
      ...order,
      shippingAddress: fullAddressSnapshot,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const handleOrderStatusUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, trackingNumber, shippingProvider, notes } = req.body;

    const allowedStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status value' });
    }

    const existingOrder = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: { items: true },
    });

    if (!existingOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // If order was cancelled and is now moving from cancelled to something else or vice-versa
    const wasCancelled = existingOrder.status === 'CANCELLED';
    const isNowCancelled = status === 'CANCELLED';

    if (!wasCancelled && isNowCancelled) {
      // Restore stock for cancelled order items
      for (const item of existingOrder.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
          },
        });
      }
    } else if (wasCancelled && !isNowCancelled && status) {
      // Re-decrement stock
      for (const item of existingOrder.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      }
    }

    const updated = await prisma.order.update({
      where: { id: existingOrder.id },
      data: {
        status: status || undefined,
        paymentStatus: paymentStatus || undefined,
        trackingNumber: trackingNumber !== undefined ? trackingNumber : undefined,
        shippingProvider: shippingProvider !== undefined ? shippingProvider : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
      include: { items: true },
    });

    let parsedAddress = {};
    try {
      parsedAddress = JSON.parse(updated.shippingAddress);
    } catch {
      parsedAddress = { line1: updated.shippingAddress };
    }

    res.json({
      ...updated,
      shippingAddress: parsedAddress,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

app.put('/api/orders/:id/status', authMiddleware, handleOrderStatusUpdate);
app.patch('/api/orders/:id/status', authMiddleware, handleOrderStatusUpdate);

app.put('/api/orders/:id/payment', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;
    const allowed = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];
    if (!allowed.includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { paymentStatus },
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 8. CUSTOMERS
// ==========================================

app.get('/api/customers', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        orders: {
          select: { id: true, total: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        addresses: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const customers = users.map((user) => {
      const activeOrders = user.orders.filter((o) => o.status !== 'CANCELLED');
      const totalSpent = activeOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      return {
        id: user.id,
        name: user.name || 'Anonymous',
        email: user.email,
        phone: user.phone || 'N/A',
        orders: user.orders.length,
        totalSpending: totalSpent,
        totalSpent,
        lastOrder: user.orders[0]?.createdAt || null,
        status: user.orders.length > 0 ? 'ACTIVE' : 'NEW',
        createdAt: user.createdAt,
      };
    });

    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.user.findFirst({
      where: { OR: [{ id }, { email: id }] },
      include: {
        addresses: true,
        orders: {
          include: {
            items: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const activeOrders = customer.orders.filter((o) => o.status !== 'CANCELLED');
    const totalSpent = activeOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

    // Aggregate unique purchased products
    const productStats = {};
    for (const order of customer.orders) {
      for (const item of order.items) {
        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            productId: item.productId,
            name: item.name,
            sku: item.sku || 'N/A',
            image: item.image,
            totalQuantity: 0,
            totalSpend: 0,
            lastPurchased: order.createdAt,
          };
        }
        productStats[item.productId].totalQuantity += Number(item.quantity || 0);
        productStats[item.productId].totalSpend += Number(item.price * item.quantity || 0);
      }
    }

    // Extract saved/order addresses
    const historicalAddresses = [];
    for (const order of customer.orders) {
      try {
        if (order.shippingAddress) {
          const addr = JSON.parse(order.shippingAddress);
          if (addr.line1) historicalAddresses.push(addr);
        }
      } catch {}
    }

    res.json({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      role: customer.role,
      createdAt: customer.createdAt,
      totalSpent,
      ordersCount: customer.orders.length,
      addresses: customer.addresses.length ? customer.addresses : historicalAddresses.slice(0, 3),
      orders: customer.orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        total: o.total,
        itemsCount: o.items.length,
        createdAt: o.createdAt,
      })),
      productsPurchased: Object.values(productStats),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 9. CONTENT (HOMEPAGE)
// ==========================================

app.get('/api/content/homepage', async (req, res) => {
  try {
    const content = await prisma.homepageContent.findFirst();
    res.json(
      content || {
        heroTitle: 'RAW-CULTURE',
        heroSubtitle: 'Premium streetwear for the next generation.',
        heroButton1: 'Shop Men',
        heroButton2: 'Shop Women',
        heroImage: 'https://images.pexels.com/photos/994523/pexels-photo-994523.jpeg?auto=compress&cs=tinysrgb&w=1600',
        heroVideo: 'https://videos.pexels.com/video-files/6487458/6487458-hd_1920_1080.mp4',
        brandStory: 'RAW-CULTURE blends modern staples with urban confidence and elevated everyday essentials.',
        newsletterTitle: 'Join the RAW-CULTURE list',
        newsletterCopy: 'Early access to drops, culture notes, and private offers.',
      }
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/content/homepage', authMiddleware, async (req, res) => {
  try {
    const existing = await prisma.homepageContent.findFirst();
    const data = {
      heroTitle: req.body.heroTitle || 'RAW-CULTURE',
      heroSubtitle: req.body.heroSubtitle || 'Premium streetwear for the next generation.',
      heroButton1: req.body.heroButton1 || 'Shop Men',
      heroButton2: req.body.heroButton2 || 'Shop Women',
      heroImage: req.body.heroImage || 'https://images.pexels.com/photos/994523/pexels-photo-994523.jpeg?auto=compress&cs=tinysrgb&w=1600',
      heroVideo: req.body.heroVideo || 'https://videos.pexels.com/video-files/6487458/6487458-hd_1920_1080.mp4',
      brandStory: req.body.brandStory || 'RAW-CULTURE blends modern staples with urban confidence.',
      newsletterTitle: req.body.newsletterTitle || 'Join the RAW-CULTURE list',
      newsletterCopy: req.body.newsletterCopy || 'Early access to drops, culture notes, and private offers.',
    };

    const content = existing
      ? await prisma.homepageContent.update({ where: { id: existing.id }, data })
      : await prisma.homepageContent.create({ data });

    res.json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 10. MEDIA LIBRARY
// ==========================================

app.get('/api/media', async (req, res) => {
  try {
    const media = await prisma.mediaAsset.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(media);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/media', authMiddleware, async (req, res) => {
  try {
    const { name, url, type } = req.body;
    if (!name || !url) {
      return res.status(400).json({ message: 'Media name and URL are required' });
    }

    const resolvedType = type || (url.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image');
    const asset = await prisma.mediaAsset.create({
      data: {
        name,
        url,
        type: resolvedType,
      },
    });

    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/media/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.mediaAsset.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Media deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 11. VIDEOS
// ==========================================

app.get('/api/videos', async (req, res) => {
  try {
    const videos = await prisma.videoAsset.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/videos', authMiddleware, async (req, res) => {
  try {
    const { title, url, thumbnail, productId, isActive } = req.body;
    if (!title || !url) {
      return res.status(400).json({ message: 'Video title and URL are required' });
    }

    const video = await prisma.videoAsset.create({
      data: {
        title,
        url,
        thumbnail: thumbnail || null,
        productId: productId || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    res.status(201).json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/videos/:id', authMiddleware, async (req, res) => {
  try {
    const { title, url, thumbnail, productId, isActive } = req.body;
    const video = await prisma.videoAsset.update({
      where: { id: req.params.id },
      data: {
        title: title || undefined,
        url: url || undefined,
        thumbnail: thumbnail !== undefined ? thumbnail : undefined,
        productId: productId !== undefined ? productId : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/videos/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.videoAsset.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Video deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 12. COUPONS
// ==========================================

app.get('/api/coupons', authMiddleware, async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/coupons', authMiddleware, async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, maxUses, expiresAt, isActive } = req.body;
    if (!code || discountValue === undefined || discountValue === null) {
      return res.status(400).json({ message: 'Coupon code and discount value are required' });
    }

    const upperCode = String(code).trim().toUpperCase();
    const existing = await prisma.coupon.findUnique({ where: { code: upperCode } });
    if (existing) {
      return res.status(400).json({ message: `Coupon with code "${upperCode}" already exists` });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: upperCode,
        discountType: discountType || 'PERCENTAGE',
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount || 0),
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/coupons/:id', authMiddleware, async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, maxUses, expiresAt, isActive } = req.body;
    const upperCode = code ? String(code).trim().toUpperCase() : undefined;

    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data: {
        code: upperCode,
        discountType: discountType || undefined,
        discountValue: discountValue !== undefined ? Number(discountValue) : undefined,
        minOrderAmount: minOrderAmount !== undefined ? Number(minOrderAmount) : undefined,
        maxUses: maxUses !== undefined ? (maxUses ? Number(maxUses) : null) : undefined,
        expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/coupons/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Storefront coupon validation
app.post('/api/coupons/validate', async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) return res.status(400).json({ valid: false, message: 'Coupon code is required' });

    const upperCode = String(code).trim().toUpperCase();
    const coupon = await prisma.coupon.findUnique({ where: { code: upperCode } });

    if (!coupon || !coupon.isActive) {
      return res.status(404).json({ valid: false, message: 'Invalid or inactive coupon code' });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ valid: false, message: 'This coupon has expired' });
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ valid: false, message: 'This coupon has reached its maximum usage limit' });
    }

    const orderSubtotal = Number(subtotal || 0);
    if (orderSubtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        valid: false,
        message: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`,
      });
    }

    const discountAmount =
      coupon.discountType === 'PERCENTAGE'
        ? Number(((orderSubtotal * coupon.discountValue) / 100).toFixed(2))
        : Math.min(coupon.discountValue, orderSubtotal);

    res.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      minOrderAmount: coupon.minOrderAmount,
      message: `Coupon applied: ${coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} off`}`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 13. SETTINGS
// ==========================================

app.get('/api/settings', async (req, res) => {
  try {
    let settings = await prisma.storeSetting.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await prisma.storeSetting.create({
        data: {
          id: 'default',
          storeName: 'RAW-CULTURE',
          currency: 'INR',
          supportEmail: 'support@rawculture.com',
          phone: '+91 98765 43210',
          address: 'Mumbai, India',
        },
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/settings', authMiddleware, async (req, res) => {
  try {
    const { storeName, currency, supportEmail, phone, address } = req.body;
    const settings = await prisma.storeSetting.upsert({
      where: { id: 'default' },
      update: {
        storeName: storeName || undefined,
        currency: currency || undefined,
        supportEmail: supportEmail || undefined,
        phone: phone || undefined,
        address: address || undefined,
      },
      create: {
        id: 'default',
        storeName: storeName || 'RAW-CULTURE',
        currency: currency || 'INR',
        supportEmail: supportEmail || 'support@rawculture.com',
        phone: phone || '+91 98765 43210',
        address: address || 'Mumbai, India',
      },
    });

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 404 for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: `API route ${req.method} ${req.originalUrl} not found` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`RAW-CULTURE backend running on http://localhost:${PORT}`);
});
