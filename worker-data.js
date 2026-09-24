const imageUrls = [
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
];

const productSeeds = [
  ['RAW Oversized Tee', '69', 'T-Shirts', true, true, false],
  ['Core Black Tee', '64', 'T-Shirts', false, true, true],
  ['Urban Cargo', '128', 'Pants', true, false, true],
  ['Essential Hoodie', '148', 'Hoodies', true, false, true],
  ['RAW Denim', '165', 'Pants', false, true, false],
  ['Street Utility Jacket', '220', 'Jackets', true, true, false],
  ['Signature Sweatshirt', '142', 'Hoodies', false, false, true],
  ['Culture Oversized Shirt', '110', 'Shirts', true, false, false],
  ['Monarch Cap', '42', 'Accessories', false, false, true],
  ['Breaker Belt', '56', 'Accessories', false, false, true],
  ['Noir Zip Hoodie', '160', 'Hoodies', false, true, false],
  ['Canvas Overshirt', '135', 'Shirts', true, false, false],
  ['Midnight Knit', '76', 'T-Shirts', false, false, true],
  ['Shift Work Pants', '118', 'Pants', false, true, false],
  ['Field Bomber', '210', 'Jackets', true, false, true],
  ['Studio Tote', '68', 'Accessories', false, false, true],
  ['Signal Crew', '72', 'T-Shirts', true, true, false],
  ['Layered Chino', '104', 'Pants', false, false, false],
  ['Afterhours Shirt', '126', 'Shirts', false, true, false],
];

export const demoProducts = productSeeds.map(([name, price, category, featured, newArrival, bestSeller], index) => ({
  id: `demo-product-${index + 1}`,
  name,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  sku: `RC-DEMO-${String(index + 1).padStart(3, '0')}`,
  description: `${name} from the RAW-CULTURE premium streetwear collection.`,
  price: Number(price),
  compareAtPrice: Number(price) + 20,
  salePrice: Number(price),
  stock: 12 + index,
  status: index % 4 === 0 ? 'LOW_STOCK' : 'IN_STOCK',
  featured,
  newArrival,
  bestSeller,
  category: { name: category, slug: category.toLowerCase() },
  tags: ['raw-culture', 'streetwear'],
  sizes: ['S', 'M', 'L', 'XL'],
  colors: ['Black', 'Stone'],
  images: [
    { id: `${index}-front`, url: imageUrls[index % imageUrls.length], alt: `${name} front`, ordering: 0 },
    { id: `${index}-detail`, url: imageUrls[(index + 1) % imageUrls.length], alt: `${name} detail`, ordering: 1 },
  ],
  videos: [],
}));

export const demoHomepage = {
  heroTitle: 'RAW-CULTURE',
  heroSubtitle: 'Premium streetwear for the next generation.',
  heroButton1: 'Shop Men',
  heroButton2: 'Shop Women',
  heroImage: 'https://images.pexels.com/photos/994523/pexels-photo-994523.jpeg?auto=compress&cs=tinysrgb&w=1600',
  heroVideo: 'https://videos.pexels.com/video-files/6487458/6487458-hd_1920_1080.mp4',
  brandStory: 'RAW-CULTURE blends modern staples with urban confidence and elevated everyday essentials.',
  newsletterTitle: 'Join the RAW-CULTURE list',
  newsletterCopy: 'Early access to drops, culture notes, and private offers.',
};
