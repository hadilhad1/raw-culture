const imageSets = {
  tshirt: ['/products/tshirt/front.jpg', '/products/tshirt/detail.jpg'],
  shirt: ['/products/shirt/front.jpg', '/products/shirt/detail.jpg'],
  hoodie: ['/products/hoodie/front.jpg', '/products/hoodie/detail.jpg'],
  cargo: ['/products/cargo/front.jpg', '/products/cargo/detail.jpg'],
  denim: ['/products/denim/front.jpg', '/products/denim/detail.jpg'],
  jacket: ['/products/jacket/front.jpg', '/products/jacket/detail.jpg'],
  cap: ['/products/cap/front.jpg', '/products/cap/detail.jpg'],
  bag: ['/products/bag/front.jpg', '/products/bag/detail.jpg'],
  belt: ['/products/belt/front.jpg', '/products/belt/detail.jpg'],
  sneakers: ['/products/sneakers/front.jpg', '/products/sneakers/detail.jpg'],
};

function imageSetForProduct(name, category) {
  const value = `${name} ${category}`.toLowerCase();
  if (value.includes('hoodie') || value.includes('sweatshirt')) return imageSets.hoodie;
  if (value.includes('cargo') || value.includes('chino') || value.includes('work pants')) return imageSets.cargo;
  if (value.includes('denim') || value.includes('jean')) return imageSets.denim;
  if (value.includes('jacket') || value.includes('bomber')) return imageSets.jacket;
  if (value.includes('cap')) return imageSets.cap;
  if (value.includes('belt')) return imageSets.belt;
  if (value.includes('tote') || value.includes('bag')) return imageSets.bag;
  if (category.toLowerCase().includes('shirt')) return imageSets.shirt;
  if (value.includes('sneaker') || value.includes('shoe')) return imageSets.sneakers;
  return imageSets.tshirt;
}

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
  images: imageSetForProduct(name, category).map((url, imageIndex) => ({ id: `${index}-${imageIndex}`, url, alt: `${name} ${imageIndex ? 'detail' : 'front'}`, ordering: imageIndex })),
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
