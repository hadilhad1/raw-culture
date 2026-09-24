import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { name: 'Men', slug: 'men', description: 'Essential menswear', imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80' },
  { name: 'Women', slug: 'women', description: 'Refined womenswear', imageUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80' },
  { name: 'T-Shirts', slug: 't-shirts', description: 'Clean daily staples', imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80' },
  { name: 'Shirts', slug: 'shirts', description: 'Structured layers', imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80' },
  { name: 'Hoodies', slug: 'hoodies', description: 'Comfortable elevated essentials', imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80' },
  { name: 'Pants', slug: 'pants', description: 'Relaxed utility silhouettes', imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80' },
  { name: 'Jackets', slug: 'jackets', description: 'Statement outerwear', imageUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80' },
  { name: 'Accessories', slug: 'accessories', description: 'Finishing touches', imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80' },
];

const products = [
  { name: 'RAW Oversized Tee', slug: 'raw-oversized-tee', sku: 'RC-TS-001', description: 'Heavyweight oversized t-shirt cut for an easy layered fit.', price: 69, compareAtPrice: 89, salePrice: 69, costPrice: 32, stock: 42, tags: ['oversized', 'new'], sizes: ['S', 'M', 'L', 'XL'], colors: ['Black', 'White', 'Stone'], status: 'IN_STOCK', featured: true, newArrival: true, bestSeller: false, categorySlug: 't-shirts' },
  { name: 'Core Black Tee', slug: 'core-black-tee', sku: 'RC-TS-002', description: 'A premium cotton jersey staple designed for daily rotation.', price: 64, compareAtPrice: 84, salePrice: 64, costPrice: 30, stock: 18, tags: ['core', 'classic'], sizes: ['XS', 'S', 'M', 'L'], colors: ['Black', 'Ash'], status: 'LOW_STOCK', featured: false, newArrival: true, bestSeller: true, categorySlug: 't-shirts' },
  { name: 'Urban Cargo', slug: 'urban-cargo', sku: 'RC-PN-001', description: 'Relaxed cargo trouser with a sharper urban profile.', price: 128, compareAtPrice: 158, salePrice: 128, costPrice: 58, stock: 27, tags: ['cargo', 'utility'], sizes: ['S', 'M', 'L', 'XL'], colors: ['Sand', 'Black'], status: 'IN_STOCK', featured: true, newArrival: false, bestSeller: true, categorySlug: 'pants' },
  { name: 'Essential Hoodie', slug: 'essential-hoodie', sku: 'RC-HD-001', description: 'Soft brushed fleece hoodie with a clean, elevated finish.', price: 148, compareAtPrice: 185, salePrice: 148, costPrice: 72, stock: 33, tags: ['hoodie', 'soft-touch'], sizes: ['S', 'M', 'L', 'XL'], colors: ['Charcoal', 'Bone'], status: 'IN_STOCK', featured: true, newArrival: false, bestSeller: true, categorySlug: 'hoodies' },
  { name: 'RAW Denim', slug: 'raw-denim', sku: 'RC-JN-001', description: 'Structured denim built with a premium wash and slightly relaxed fit.', price: 165, compareAtPrice: 210, salePrice: 165, costPrice: 78, stock: 14, tags: ['denim', 'premium'], sizes: ['30', '32', '34', '36'], colors: ['Indigo', 'Black'], status: 'LOW_STOCK', featured: false, newArrival: true, bestSeller: false, categorySlug: 'pants' },
  { name: 'Street Utility Jacket', slug: 'street-utility-jacket', sku: 'RC-JK-001', description: 'Weather-ready outerwear with utilitarian detailing and a modern shape.', price: 220, compareAtPrice: 280, salePrice: 220, costPrice: 120, stock: 9, tags: ['utility', 'outerwear'], sizes: ['S', 'M', 'L', 'XL'], colors: ['Olive', 'Black'], status: 'LOW_STOCK', featured: true, newArrival: true, bestSeller: false, categorySlug: 'jackets' },
  { name: 'Signature Sweatshirt', slug: 'signature-sweatshirt', sku: 'RC-SW-001', description: 'Heavyweight crewneck sweatshirt built for comfort and structure.', price: 142, compareAtPrice: 174, salePrice: 142, costPrice: 70, stock: 23, tags: ['crewneck', 'sweatshirt'], sizes: ['S', 'M', 'L', 'XL'], colors: ['Stone', 'Ink'], status: 'IN_STOCK', featured: false, newArrival: false, bestSeller: true, categorySlug: 'hoodies' },
  { name: 'Culture Oversized Shirt', slug: 'culture-oversized-shirt', sku: 'RC-SH-001', description: 'Drop shoulder button-down with raw texture and a cultural edge.', price: 110, compareAtPrice: 140, salePrice: 110, costPrice: 52, stock: 19, tags: ['shirt', 'oversized'], sizes: ['S', 'M', 'L', 'XL'], colors: ['Cream', 'Blue'], status: 'IN_STOCK', featured: true, newArrival: false, bestSeller: false, categorySlug: 'shirts' },
  { name: 'Monarch Cap', slug: 'monarch-cap', sku: 'RC-AC-001', description: 'Structured cap designed to finish off day-to-night looks.', price: 42, compareAtPrice: 58, salePrice: 42, costPrice: 18, stock: 54, tags: ['cap', 'accessory'], sizes: ['One Size'], colors: ['Black', 'Stone'], status: 'IN_STOCK', featured: false, newArrival: false, bestSeller: true, categorySlug: 'accessories' },
  { name: 'Breaker Belt', slug: 'breaker-belt', sku: 'RC-AC-002', description: 'Minimal leather belt with a refined matte hardware finish.', price: 56, compareAtPrice: 72, salePrice: 56, costPrice: 24, stock: 30, tags: ['belt', 'leather'], sizes: ['S', 'M', 'L'], colors: ['Black', 'Tan'], status: 'IN_STOCK', featured: false, newArrival: false, bestSeller: true, categorySlug: 'accessories' },
  { name: 'Noir Zip Hoodie', slug: 'noir-zip-hoodie', sku: 'RC-HD-002', description: 'Modern zip hoodie with an athletic, dropped silhouette.', price: 160, compareAtPrice: 195, salePrice: 160, costPrice: 80, stock: 11, tags: ['zip', 'athletic'], sizes: ['S', 'M', 'L', 'XL'], colors: ['Black', 'Night Blue'], status: 'LOW_STOCK', featured: false, newArrival: true, bestSeller: false, categorySlug: 'hoodies' },
  { name: 'Canvas Overshirt', slug: 'canvas-overshirt', sku: 'RC-SH-002', description: 'Midweight canvas overshirt with utility pockets and a relaxed fit.', price: 135, compareAtPrice: 170, salePrice: 135, costPrice: 60, stock: 8, tags: ['overshirt', 'utility'], sizes: ['S', 'M', 'L', 'XL'], colors: ['Sand', 'Olive'], status: 'LOW_STOCK', featured: true, newArrival: false, bestSeller: false, categorySlug: 'shirts' },
  { name: 'Midnight Knit', slug: 'midnight-knit', sku: 'RC-TS-003', description: 'Premium knit tee with a softer drape and subtle texture.', price: 76, compareAtPrice: 95, salePrice: 76, costPrice: 34, stock: 17, tags: ['knit', 'soft'], sizes: ['S', 'M', 'L', 'XL'], colors: ['Midnight', 'Ash'], status: 'IN_STOCK', featured: false, newArrival: false, bestSeller: true, categorySlug: 't-shirts' },
  { name: 'Shift Work Pants', slug: 'shift-work-pants', sku: 'RC-PN-002', description: 'A clean tapered trouser built for everyday structure.', price: 118, compareAtPrice: 150, salePrice: 118, costPrice: 54, stock: 21, tags: ['tapered', 'workwear'], sizes: ['30', '32', '34', '36'], colors: ['Stone', 'Graphite'], status: 'IN_STOCK', featured: false, newArrival: true, bestSeller: false, categorySlug: 'pants' },
  { name: 'Field Bomber', slug: 'field-bomber', sku: 'RC-JK-002', description: 'Bomber silhouette with interior lining and clean finish.', price: 210, compareAtPrice: 260, salePrice: 210, costPrice: 102, stock: 16, tags: ['bomber', 'outerwear'], sizes: ['S', 'M', 'L', 'XL'], colors: ['Navy', 'Black'], status: 'IN_STOCK', featured: true, newArrival: false, bestSeller: true, categorySlug: 'jackets' },
  { name: 'Studio Tote', slug: 'studio-tote', sku: 'RC-AC-003', description: 'Utility tote for city carry with a premium matte finish.', price: 68, compareAtPrice: 88, salePrice: 68, costPrice: 28, stock: 44, tags: ['tote', 'utility'], sizes: ['One Size'], colors: ['Black', 'Cream'], status: 'IN_STOCK', featured: false, newArrival: false, bestSeller: true, categorySlug: 'accessories' },
  { name: 'Signal Crew', slug: 'signal-crew', sku: 'RC-TS-004', description: 'A brighter, statement-driven crew tee made with premium cotton.', price: 72, compareAtPrice: 90, salePrice: 72, costPrice: 32, stock: 12, tags: ['signal', 'statement'], sizes: ['S', 'M', 'L', 'XL'], colors: ['Electric Blue', 'White'], status: 'LOW_STOCK', featured: true, newArrival: true, bestSeller: false, categorySlug: 't-shirts' },
  { name: 'Layered Chino', slug: 'layered-chino', sku: 'RC-PN-003', description: 'Relaxed chino with a clean drape and premium finish.', price: 104, compareAtPrice: 130, salePrice: 104, costPrice: 48, stock: 25, tags: ['chino', 'layered'], sizes: ['30', '32', '34', '36'], colors: ['Khaki', 'Stone'], status: 'IN_STOCK', featured: false, newArrival: false, bestSeller: false, categorySlug: 'pants' },
  { name: 'Afterhours Shirt', slug: 'afterhours-shirt', sku: 'RC-SH-003', description: 'An elevated dress shirt with a casual stretch fit.', price: 126, compareAtPrice: 158, salePrice: 126, costPrice: 58, stock: 20, tags: ['dress', 'casual'], sizes: ['S', 'M', 'L', 'XL'], colors: ['White', 'Blue'], status: 'IN_STOCK', featured: false, newArrival: true, bestSeller: false, categorySlug: 'shirts' }
];

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVideo.deleteMany();
  await prisma.product.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.category.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();

  const createdCategories = [];
  for (const category of categories) {
    createdCategories.push(await prisma.category.create({ data: category }));
  }

  await prisma.collection.createMany({
    data: [
      { name: 'Summer 2026', slug: 'summer-2026', description: 'Warm-season essentials', imageUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80' },
      { name: 'Street Essentials', slug: 'street-essentials', description: 'The everyday uniform', imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80' },
      { name: 'Midnight Collection', slug: 'midnight-collection', description: 'Dark and elevated silhouettes', imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80' }
    ]
  });

  const passwordHash = await bcrypt.hash('Admin@123', 10);
  await prisma.admin.create({
    data: {
      email: 'admin@rawculture.com',
      name: 'RAW-CULTURE Admin',
      passwordHash,
    }
  });

  for (const product of products) {
    const category = createdCategories.find((c) => c.slug === product.categorySlug);
    const productRecord = await prisma.product.create({
      data: {
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        salePrice: product.salePrice,
        costPrice: product.costPrice,
        stock: product.stock,
        sizes: product.sizes.join(','),
        colors: product.colors.join(','),
        tags: product.tags.join(','),
        status: product.status,
        featured: product.featured,
        newArrival: product.newArrival,
        bestSeller: product.bestSeller,
        categoryId: category.id,
        images: {
          create: {
            url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
            alt: product.name,
            ordering: 0,
          }
        },
        videos: {
          create: {
            url: 'https://cdn.coverr.co/videos/coverr-man-walking-in-a-city-1562117187740/1080p.mp4',
          }
        }
      }
    });

    await prisma.productImage.createMany({
      data: [
        { productId: productRecord.id, url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80', alt: `${product.name} Front`, ordering: 0 },
        { productId: productRecord.id, url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80', alt: `${product.name} Back`, ordering: 1 },
      ]
    });
  }

  await prisma.homepageContent.create({
    data: {
      heroTitle: 'RAW-CULTURE',
      heroSubtitle: 'Premium streetwear for the next generation.',
      heroButton1: 'Shop Men',
      heroButton2: 'Shop Women',
      heroImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1600&q=80',
      heroVideo: 'https://cdn.coverr.co/videos/coverr-man-in-black-shirt-walking-1562146307003/1080p.mp4',
      brandStory: 'RAW-CULTURE blends modern staples with urban confidence and elevated everyday essentials.',
      newsletterTitle: 'Join the RAW-CULTURE list',
      newsletterCopy: 'Early access to drops, culture notes, and private offers.',
    }
  });

  console.log('Database seeded with demo content.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
