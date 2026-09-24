import { Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');
const currency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value || 0));

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json') || contentType.includes('+json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = isJson
      ? (payload?.message || payload?.error || 'Request failed')
      : (typeof payload === 'string' && payload.includes('<!DOCTYPE'))
        ? 'The server returned an unexpected HTML response.'
        : 'Request failed';
    throw new Error(message);
  }

  if (!isJson && payload && typeof payload === 'string' && payload.includes('<!DOCTYPE')) {
    throw new Error('The server returned an unexpected HTML response.');
  }

  return payload;
}

function useCart() {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('raw-culture-cart') || '[]'); } catch { return []; }
  });

  useEffect(() => { localStorage.setItem('raw-culture-cart', JSON.stringify(cart)); }, [cart]);

  const addToCart = (product, options = {}) => {
    const key = `${product.id}-${options.size || 'One Size'}-${options.color || 'Standard'}`;
    setCart((items) => {
      const existing = items.find((item) => item.key === key);
      if (existing) return items.map((item) => item.key === key ? { ...item, quantity: item.quantity + 1 } : item);
      return [
        ...items,
        {
          key,
          productId: product.id,
          name: product.name,
          sku: product.sku || 'RC-ITEM',
          category: product.category?.name || 'Streetwear',
          price: Number(product.salePrice || product.price),
          image: product.images?.[0]?.url || '',
          size: options.size || product.sizes?.[0] || 'One Size',
          color: options.color || product.colors?.[0] || 'Standard',
          quantity: 1,
        },
      ];
    });
  };
  const updateQuantity = (key, quantity) => setCart((items) => items.map((item) => item.key === key ? { ...item, quantity: Math.max(0, quantity) } : item).filter((item) => item.quantity > 0));
  const removeFromCart = (key) => setCart((items) => items.filter((item) => item.key !== key));
  return { cart, addToCart, updateQuantity, removeFromCart, clearCart: () => setCart([]) };
}

function useWishlist() {
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('raw-culture-wishlist') || '[]'); } catch { return []; }
  });
  useEffect(() => { localStorage.setItem('raw-culture-wishlist', JSON.stringify(wishlist)); }, [wishlist]);
  const toggleWishlist = (product) => setWishlist((items) => items.some((item) => item.id === product.id) ? items.filter((item) => item.id !== product.id) : [...items, product]);
  return { wishlist, toggleWishlist };
}

function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    requestJson(`${API_URL}/products`)
      .then((data) => {
        if (!mounted) return;
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setError('Unable to load products. Please check the API connection.');
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  return { products, loading, error };
}

function useHomepageContent() {
  const [content, setContent] = useState({
    heroTitle: 'RAW-CULTURE',
    heroSubtitle: 'Premium streetwear for the next generation.',
    heroButton1: 'Shop Men',
    heroButton2: 'Shop Women',
    heroImage: 'https://images.pexels.com/photos/994523/pexels-photo-994523.jpeg?auto=compress&cs=tinysrgb&w=1600',
    heroVideo: 'https://videos.pexels.com/video-files/6487458/6487458-hd_1920_1080.mp4',
    brandStory: 'RAW-CULTURE blends modern staples with urban confidence and elevated everyday essentials.',
    newsletterTitle: 'Join the RAW-CULTURE list',
    newsletterCopy: 'Early access to drops, culture notes, and private offers.'
  });

  useEffect(() => {
    requestJson(`${API_URL}/content/homepage`)
      .then((data) => {
        if (data) setContent((current) => ({ ...current, ...data }));
      })
      .catch(() => {});
  }, []);

  return content;
}

function ProductCard({ product, onAdd, onWishlist, wished }) {
  const [image, setImage] = useState(product.images?.[0]?.url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80');
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (!isAdded) return;
    const timer = setTimeout(() => setIsAdded(false), 420);
    return () => clearTimeout(timer);
  }, [isAdded]);

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onAdd(product);
    setIsAdded(true);
  };

  const handleWishlist = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onWishlist(product);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className="product-card group relative overflow-hidden rounded-[26px] bg-white shadow-raw"
      whileHover={{ y: -6, scale: 1.01 }}
      animate={isAdded ? { scale: [1, 1.03, 1], rotate: [0, -1.5, 1.5, 0] } : { scale: 1, rotate: 0 }}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#ece7df]">
        <Link to={`/products/${product.slug || product.id}`} aria-label={`View ${product.name}`} className="absolute inset-0 z-0" />
        <img src={image} alt={product.name} className="pointer-events-none h-full w-full object-cover" onMouseEnter={() => setImage(product.images?.[1]?.url || product.images?.[0]?.url || image)} onMouseLeave={() => setImage(product.images?.[0]?.url || image)} />
        <div className="absolute left-4 top-4 flex gap-2">
          {product.newArrival && <span className="rounded-full bg-raw-lime px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-black">New</span>}
          {product.compareAtPrice && <span className="rounded-full bg-black px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">Sale</span>}
        </div>
        <motion.button
          type="button"
          onClick={handleWishlist}
          whileTap={{ scale: 0.82 }}
          animate={{ scale: wished ? [1, 1.25, 1] : 1, rotate: wished ? [0, -10, 8, 0] : 0 }}
          transition={{ duration: 0.3 }}
          className={`absolute right-4 top-4 z-10 rounded-full border border-black/10 bg-white/80 p-2 text-sm transition ${wished ? 'text-red-600' : ''}`}
        >
          {wished ? '♥' : '♡'}
        </motion.button>
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-black/60">{product.category?.name || 'Shop'}</p>
            <Link to={`/products/${product.slug || product.id}`} className="mt-1 block text-lg font-medium text-black hover:underline">{product.name}</Link>
          </div>
          <div className="text-right">
            <p className="text-base font-semibold text-black">{currency(product.price)}</p>
            {product.compareAtPrice && <p className="text-xs text-black/45 line-through">{currency(product.compareAtPrice)}</p>}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.15em] text-black/60">
            {(product.colors || []).slice(0, 3).map((color) => (
              <span key={color} className="rounded-full border border-black/10 px-2 py-1">{color}</span>
            ))}
          </div>
          <motion.button
            type="button"
            onClick={handleAddToCart}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            className="rounded-full bg-black px-3 py-2 text-[9px] font-medium uppercase tracking-[0.18em] text-white transition hover:bg-raw-accent"
          >
            {isAdded ? 'Added' : 'Add'}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

function SectionTitle({ eyebrow, title, action }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-black/55">{eyebrow}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-black md:text-4xl">{title}</h2>
      </div>
      {action ? <button className="hidden rounded-full border border-black/15 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-black md:inline-flex transition hover:translate-x-1">{action}</button> : null}
    </div>
  );
}

function Header({ cartCount = 0 }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#111315]/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 md:px-10">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-black uppercase tracking-[0.18em] text-white md:text-2xl">RAW-CULTURE</Link>
          <nav className="hidden items-center gap-7 text-[11px] font-medium uppercase tracking-[0.22em] text-white/70 md:flex">
            <NavLink to="/shop">Shop</NavLink>
            <NavLink to="/men">Men</NavLink>
            <NavLink to="/women">Women</NavLink>
            <NavLink to="/journal">Journal</NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-xs uppercase tracking-[0.18em] text-white/70">
          <button className="transition hover:text-white">Search</button>
          <Link to="/wishlist" className="transition hover:text-white">Wishlist</Link>
          <Link to="/cart" className="transition hover:text-white">Cart ({cartCount})</Link>
        </div>
      </div>
    </header>
  );
}

function HomePage({ cartCount, onAdd, onWishlist, wishlist }) {
  const { products, loading, error } = useProducts();
  const content = useHomepageContent();
  const featuredProducts = useMemo(() => (products || []).filter((product) => product.featured).slice(0, 4), [products]);
  const trendingProducts = useMemo(() => (products || []).filter((product) => product.bestSeller).slice(0, 4), [products]);

  return (
    <div className="app-shell min-h-screen text-white">
      <Header cartCount={cartCount} />
      <div className="mx-auto flex max-w-[1440px] items-center justify-center bg-[#171b1d] px-4 py-3 text-center text-[10px] font-medium uppercase tracking-[0.26em] text-raw-silver">
        Free worldwide shipping over $200 • New drop now live
      </div>

      <main>
        <section className="mx-auto grid max-w-[1440px] gap-6 px-5 pb-10 md:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pb-20">
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="space-y-7 pt-8 lg:pt-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-[10px] uppercase tracking-[0.26em] text-raw-silver">
              <span className="h-2 w-2 rounded-full bg-raw-lime" /> New season / 2026
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-raw-silver">Editorial essentials</p>
              <h1 className="mt-4 max-w-xl text-5xl font-black uppercase tracking-[-0.08em] text-white md:text-7xl">{content.heroTitle}</h1>
            </div>
            <p className="max-w-lg text-base text-white/70">{content.heroSubtitle}</p>
            <div className="flex flex-wrap gap-4">
              <Link to="/men" className="rounded-full bg-raw-accent px-6 py-3 text-[11px] font-medium uppercase tracking-[0.22em] text-white transition hover:translate-y-[-2px] hover:bg-[#2346d6]">{content.heroButton1}</Link>
              <Link to="/women" className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-[11px] font-medium uppercase tracking-[0.22em] text-white transition hover:border-white/40 hover:bg-white/10">{content.heroButton2}</Link>
              <Link to="/shop" className="rounded-full border border-raw-lime/40 bg-raw-lime px-6 py-3 text-[11px] font-medium uppercase tracking-[0.22em] text-black transition hover:translate-y-[-2px]">Explore Collection</Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#1a1d20]">
            <div className="relative aspect-[4/5] overflow-hidden">
              <video className="h-full w-full object-cover" autoPlay muted loop playsInline preload="metadata" poster={content.heroImage}>
                <source src={content.heroVideo || 'https://videos.pexels.com/video-files/6487458/6487458-hd_1920_1080.mp4'} type="video/mp4" />
              </video>
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/90 via-black/30 to-transparent p-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-white/60">Featured drop</p>
                <p className="mt-2 text-xl font-medium text-white">Street / Utility / Minimal</p>
              </div>
              <div className="rounded-full border border-white/20 bg-white/5 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-white/80">2026</div>
            </div>
          </motion.div>
        </section>

        <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-10">
          <div className="mb-8 flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-black/55">Video story</p>
          </div>
          <div className="relative overflow-hidden rounded-[30px] border border-black/10 bg-black">
            <div className="mx-auto max-w-[900px] p-2 md:p-5">
              <video className="h-[520px] w-full rounded-[24px] object-cover md:h-[720px]" autoPlay muted loop playsInline preload="metadata" poster="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1400&q=80">
                <source src="https://videos.pexels.com/video-files/6487458/6487458-hd_1920_1080.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </section>

        <section className="bg-raw-cream px-5 py-16 text-black md:px-10">
          <div className="mx-auto max-w-[1440px]">
            <SectionTitle eyebrow="New Arrivals" title="Fresh lines for the season" action="View all" />
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {loading ? <div className="col-span-full rounded-full border border-black/10 bg-white px-6 py-4 text-black">Loading products...</div> : error ? <div className="col-span-full rounded-full border border-red-300 bg-red-50 px-6 py-4 text-red-700">{error}</div> : featuredProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={onAdd} onWishlist={onWishlist} wished={wishlist.some((item) => item.id === product.id)} />)}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-10">
          <SectionTitle eyebrow="Featured Collection" title="Built for motion and city rhythm" action="Shop collection" />
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="overflow-hidden rounded-[32px] bg-[#e8e2d8]">
              <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=80" alt="Featured collection" className="h-[520px] w-full object-cover" />
            </div>
            <div className="grid gap-6">
              <div className="rounded-[28px] bg-[#171b1d] p-7 text-white">
                <p className="text-[10px] uppercase tracking-[0.28em] text-white/60">01 / Core Drop</p>
                <h3 className="mt-6 text-3xl font-semibold tracking-[-0.06em]">Utility silhouettes, redefined.</h3>
                <p className="mt-4 text-white/70">Modern essentials for all-day movement with a premium finish.</p>
                <button className="mt-8 rounded-full bg-raw-accent px-5 py-3 text-[10px] uppercase tracking-[0.22em] text-white transition hover:translate-x-1">Explore</button>
              </div>
              <div className="overflow-hidden rounded-[28px] bg-[#dfe3e4]">
                <img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80" alt="Street look" className="h-[250px] w-full object-cover" />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#e8eaea] px-5 py-16 text-black md:px-10">
          <div className="mx-auto max-w-[1440px]">
            <SectionTitle eyebrow="Categories" title="Shop by mood" action="Browse all" />
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {['Men', 'Women', 'T-Shirts', 'Hoodies', 'Pants', 'Accessories'].map((category, index) => (
                <Link key={category} to="/shop" className="group relative overflow-hidden rounded-[28px] bg-white">
                  <img src={['https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80'][index]} alt={category} className="h-[300px] w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-white/70">Collection</p>
                    <h3 className="mt-2 text-2xl font-medium text-white">{category}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-raw-cream px-5 py-16 text-black md:px-10">
          <div className="mx-auto max-w-[1440px]">
            <SectionTitle eyebrow="Trending now" title="Most wanted essentials" action="Shop all" />
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {(trendingProducts || []).map((product) => <ProductCard key={product.id} product={product} onAdd={onAdd} onWishlist={onWishlist} wished={wishlist.some((item) => item.id === product.id)} />)}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="overflow-hidden rounded-[32px] bg-[#dfe3e4]">
              <img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80" alt="Brand story" className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col justify-center rounded-[32px] bg-[#171b1d] p-8 text-white md:p-12">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/60">Our story</p>
              <h2 className="mt-6 text-4xl font-semibold tracking-[-0.06em]">A culture built through movement.</h2>
              <p className="mt-5 max-w-xl text-white/70">{content.brandStory}</p>
              <button className="mt-8 inline-flex w-fit rounded-full border border-white/15 bg-white/5 px-5 py-3 text-[10px] uppercase tracking-[0.22em] text-white transition hover:translate-x-1">Read more</button>
            </div>
          </div>
        </section>

        <section className="bg-[#111315] px-5 py-16 text-white md:px-10">
          <div className="mx-auto max-w-[1440px]">
            <SectionTitle eyebrow="Instagram" title="#RAWCULTURE" action="Follow us" />
            <div className="grid gap-4 md:grid-cols-4">
              {[1,2,3,4].map((i) => (
                <img key={i} src={`https://images.unsplash.com/photo-${i===1 ? '1521572267360-ee0c2909d518' : i===2 ? '1507679799987-c73779587ccf' : i===3 ? '1515886657613-9f3515b0c78f' : '1529139574466-a303027c1d8b'}?auto=format&fit=crop&w=800&q=80`} alt="Instagram shot" className="h-[260px] w-full rounded-[24px] object-cover" />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-raw-cream px-5 py-16 text-black md:px-10">
          <div className="mx-auto max-w-[720px] rounded-[32px] bg-[#f7f3ed] p-8 text-center shadow-raw md:p-12">
            <p className="text-[10px] uppercase tracking-[0.28em] text-black/55">Newsletter</p>
            <h3 className="mt-5 text-3xl font-semibold tracking-[-0.05em] md:text-5xl">{content.newsletterTitle}</h3>
            <p className="mt-4 text-black/65">{content.newsletterCopy}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <input className="flex-1 rounded-full border border-black/15 bg-white px-4 py-3 text-black outline-none" placeholder="Email address" />
              <button className="rounded-full bg-black px-6 py-3 text-[10px] uppercase tracking-[0.22em] text-white">Sign up</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-[1440px] px-5 pb-10 pt-12 md:px-10">
        <div className="grid gap-8 border-t border-white/15 pt-8 md:grid-cols-4">
          <div>
            <p className="text-2xl font-black uppercase tracking-[0.18em] text-white">RAW-CULTURE</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/60">Shop</p>
            <ul className="mt-4 space-y-3 text-white/70">
              <li>Men</li>
              <li>Women</li>
              <li>Accessories</li>
            </ul>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/60">About</p>
            <ul className="mt-4 space-y-3 text-white/70">
              <li>Journal</li>
              <li>Stories</li>
              <li>Shipping</li>
            </ul>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/60">Support</p>
            <ul className="mt-4 space-y-3 text-white/70">
              <li>Contact</li>
              <li>Returns</li>
              <li>Privacy</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CatalogPage({ cartCount, onAdd, onWishlist, wishlist }) {
  const { products, loading, error } = useProducts();

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-black">
      <Header cartCount={cartCount} />
      <main className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-black/55">Shop all</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em]">RAW essentials</h1>
          </div>
          <div className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs uppercase tracking-[0.2em]">{(products || []).length} products</div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {loading ? <div className="col-span-full rounded-full border border-black/10 bg-white px-6 py-4">Loading products...</div> : error ? <div className="col-span-full rounded-full border border-red-300 bg-red-50 px-6 py-4 text-red-700">{error}</div> : (products || []).map((product) => <ProductCard key={product.id} product={product} onAdd={onAdd} onWishlist={onWishlist} wished={wishlist.some((item) => item.id === product.id)} />)}
        </div>
      </main>
    </div>
  );
}

function ProductPage({ cartCount, onAdd, onWishlist, wishlist = [] }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen bg-[#f4f1ea] p-10 text-black">Loading product...</div>;
  if (!product) return <div className="min-h-screen bg-[#f4f1ea] p-10 text-black">Product not found.</div>;

  const sizes = product.sizes || [];
  const colors = product.colors || [];
  const wished = wishlist.some((item) => item.id === product.id);
  const addSelected = () => {
    if (sizes.length && !size) { setMessage('Please select a size.'); return; }
    if (colors.length && !color) { setMessage('Please select a color.'); return; }
    for (let index = 0; index < quantity; index += 1) onAdd(product, { size, color });
    setMessage('Added to cart.');
  };

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-black">
      <Header cartCount={cartCount} />
      <main className="mx-auto grid max-w-[1440px] gap-10 px-5 py-10 md:px-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <motion.div key={selectedImage} initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} className="overflow-hidden rounded-[28px] bg-white p-4 shadow-md">
            <img src={product.images?.[selectedImage]?.url || product.images?.[0]?.url} alt={product.images?.[selectedImage]?.alt || product.name} className="h-[620px] w-full rounded-[20px] object-contain" />
          </motion.div>
          <div className="mt-4 flex gap-3 overflow-x-auto">{(product.images || []).map((image, index) => <button key={image.id || image.url} onClick={() => setSelectedImage(index)} className={`h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${selectedImage === index ? 'border-black' : 'border-transparent'}`}><img src={image.url} alt={image.alt || product.name} className="h-full w-full object-cover" /></button>)}</div>
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-[11px] uppercase tracking-[0.28em] text-black/60">{product.category?.name || 'Essential'}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em]">{product.name}</h1>
          <div className="mt-5 flex items-center gap-4">
            <span className="text-3xl font-bold">{currency(product.price)}</span>
            {product.compareAtPrice && <span className="text-lg text-black/45 line-through">{currency(product.compareAtPrice)}</span>}
          </div>
          <p className="mt-5 text-black/70">{product.description}</p>
          <div className="mt-8 space-y-5">
            {colors.length > 0 && <div><p className="mb-2 text-xs uppercase tracking-[0.2em]">Color</p><div className="flex flex-wrap gap-2">{colors.map((option) => <button key={option} onClick={() => setColor(option)} className={`rounded-full border px-4 py-2 text-xs uppercase ${color === option ? 'border-black bg-black text-white' : 'border-black/20 bg-white'}`}>{option}</button>)}</div></div>}
            {sizes.length > 0 && <div><p className="mb-2 text-xs uppercase tracking-[0.2em]">Size</p><div className="flex flex-wrap gap-2">{sizes.map((option) => <button key={option} onClick={() => setSize(option)} className={`min-w-12 rounded-lg border px-3 py-2 text-xs ${size === option ? 'border-black bg-black text-white' : 'border-black/20 bg-white'}`}>{option}</button>)}</div></div>}
            <div className="flex items-center gap-3"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-10 w-10 rounded-full border">−</button><span>{quantity}</span><button onClick={() => setQuantity(Math.min(Number(product.stock || 1), quantity + 1))} className="h-10 w-10 rounded-full border">+</button><span className="text-sm text-black/60">{product.stock > 0 ? `${product.stock} available` : 'Out of stock'}</span></div>
            {message && <p className="text-sm text-raw-accent">{message}</p>}
            <div className="flex flex-wrap gap-3"><button disabled={!product.stock} onClick={addSelected} className="rounded-full bg-raw-accent px-6 py-3 text-[10px] uppercase tracking-[0.22em] text-white disabled:opacity-40">Add to cart</button><button onClick={() => onWishlist(product)} className="rounded-full border border-black/15 bg-white px-6 py-3 text-[10px] uppercase tracking-[0.22em] text-black">{wished ? '♥ Wishlisted' : '♡ Wishlist'}</button></div>
          </div>
          <div className="mt-8 grid gap-4 rounded-[24px] border border-black/10 bg-white p-5">
            <div><strong>Sizes:</strong> {(product.sizes || []).join(', ') || 'One Size'}</div>
            <div><strong>Colors:</strong> {(product.colors || []).join(', ') || 'Standard'}</div>
            <div><strong>Stock:</strong> {product.stock}</div>
          </div>
        </div>
      </main>
    </div>
  );
}

function CheckoutPage({ cart, clearCart }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const shippingFee = subtotal > 200 ? 0 : 40;
  const grandTotal = Math.max(0, subtotal - discount + shippingFee);

  const applyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch(`${API_URL}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim(), subtotal }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        throw new Error(data.message || 'Invalid coupon');
      }
      setAppliedCoupon(data);
      setCouponInput('');
    } catch (err) {
      setCouponError(err.message || 'Could not validate coupon');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(event.currentTarget);

    const shippingAddress = {
      line1: form.get('address1') || '',
      line2: form.get('address2') || '',
      city: form.get('city') || '',
      state: form.get('state') || '',
      postalCode: form.get('postalCode') || '',
      country: form.get('country') || 'India',
    };

    const payload = {
      name: form.get('name'),
      email: form.get('email'),
      phone: form.get('phone'),
      shippingAddress,
      items: cart.map((item) => ({
        productId: item.productId,
        name: item.name,
        sku: item.sku || 'RC-ITEM',
        price: item.price,
        image: item.image || '',
        size: item.size || 'Standard',
        color: item.color || 'Standard',
        quantity: item.quantity,
      })),
      subtotal,
      discount,
      shippingFee,
      total: grandTotal,
      couponCode: appliedCoupon?.code || undefined,
      paymentMethod: form.get('paymentMethod') || 'cod',
    };

    try {
      const result = await requestJson(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      clearCart();
      navigate(`/order-success/${result.id || result.orderNumber}`);
    } catch (err) {
      setError(err.message || 'Unable to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!cart.length) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] text-black">
        <Header />
        <main className="mx-auto max-w-[900px] px-5 py-20 text-center">
          <h1 className="text-4xl font-semibold">Checkout</h1>
          <p className="mt-4 text-black/60">Your cart is empty. Add products to begin checkout.</p>
          <Link to="/shop" className="mt-6 inline-flex rounded-full bg-black px-6 py-3 text-xs uppercase tracking-[0.2em] text-white">Explore Catalog</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-black">
      <Header cartCount={cart.length} />
      <main className="mx-auto grid max-w-[1200px] gap-8 px-5 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <form onSubmit={submitOrder} className="space-y-5 rounded-[28px] bg-white p-7 shadow-md">
            <h1 className="text-3xl font-semibold tracking-[-0.04em]">Delivery & Customer Details</h1>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-black/60">Full Name *</label>
                <input name="name" required className="w-full rounded-xl border border-black/15 px-4 py-3 outline-none focus:border-black" placeholder="John Doe" />
              </div>

              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-black/60">Email Address *</label>
                <input type="email" name="email" required className="w-full rounded-xl border border-black/15 px-4 py-3 outline-none focus:border-black" placeholder="john@example.com" />
              </div>

              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-black/60">Phone Number *</label>
                <input type="tel" name="phone" required className="w-full rounded-xl border border-black/15 px-4 py-3 outline-none focus:border-black" placeholder="+91 98765 43210" />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-black/60">Street Address *</label>
                <input name="address1" required className="w-full rounded-xl border border-black/15 px-4 py-3 outline-none focus:border-black" placeholder="Flat / House No., Building, Street" />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-black/60">Apartment, Suite, Landmark (Optional)</label>
                <input name="address2" className="w-full rounded-xl border border-black/15 px-4 py-3 outline-none focus:border-black" placeholder="Near City Mall, Landmark" />
              </div>

              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-black/60">City *</label>
                <input name="city" required className="w-full rounded-xl border border-black/15 px-4 py-3 outline-none focus:border-black" placeholder="Mumbai" />
              </div>

              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-black/60">State *</label>
                <input name="state" required className="w-full rounded-xl border border-black/15 px-4 py-3 outline-none focus:border-black" placeholder="Maharashtra" />
              </div>

              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-black/60">Postal / PIN Code *</label>
                <input name="postalCode" required className="w-full rounded-xl border border-black/15 px-4 py-3 outline-none focus:border-black" placeholder="400001" />
              </div>

              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-black/60">Country *</label>
                <input name="country" defaultValue="India" required className="w-full rounded-xl border border-black/15 px-4 py-3 outline-none focus:border-black" />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-black/60">Payment Method</label>
                <select name="paymentMethod" className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black">
                  <option value="cod">Cash on Delivery (Pay upon delivery)</option>
                  <option value="online">Online Payment (UPI, Card, Net Banking)</option>
                </select>
              </div>
            </div>

            {error && <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

            <button disabled={loading} type="submit" className="w-full rounded-full bg-raw-accent px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg transition hover:bg-[#2346d6] disabled:opacity-50">
              {loading ? 'Processing Order...' : `Place Order • ${currency(grandTotal)}`}
            </button>
          </form>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[28px] bg-white p-7 shadow-md">
            <h2 className="text-xl font-semibold">Have a Coupon?</h2>
            {appliedCoupon ? (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-50 p-3 text-emerald-800">
                <div>
                  <span className="font-bold">{appliedCoupon.code}</span> applied: {currency(appliedCoupon.discountAmount)} off
                </div>
                <button type="button" onClick={removeCoupon} className="text-xs text-red-600 underline hover:text-red-800">Remove</button>
              </div>
            ) : (
              <div className="mt-4 flex gap-2">
                <input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder="e.g. RAW10" className="flex-1 rounded-xl border border-black/15 px-4 py-2 uppercase outline-none focus:border-black" />
                <button type="button" disabled={couponLoading} onClick={applyCoupon} className="rounded-xl bg-black px-4 py-2 text-xs uppercase tracking-[0.15em] text-white disabled:opacity-50">
                  {couponLoading ? 'Checking...' : 'Apply'}
                </button>
              </div>
            )}
            {couponError && <p className="mt-2 text-xs text-red-600">{couponError}</p>}
          </div>

          <div className="rounded-[28px] bg-[#171b1d] p-7 text-white shadow-xl">
            <h2 className="text-xl font-semibold">Order Summary</h2>
            <div className="mt-6 divide-y divide-white/10">
              {cart.map((item) => (
                <div key={item.key} className="flex gap-4 py-4">
                  <img src={item.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=150&q=80'} alt={item.name} className="h-16 w-14 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-xs text-white/50">Size: {item.size} | Color: {item.color}</p>
                    <p className="mt-1 text-xs text-white/70">Qty: {item.quantity} × {currency(item.price)}</p>
                  </div>
                  <div className="font-semibold">{currency(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-2 border-t border-white/15 pt-5 text-sm text-white/80">
              <div className="flex justify-between"><span>Subtotal</span><span>{currency(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-emerald-400"><span>Coupon Discount ({appliedCoupon?.code})</span><span>−{currency(discount)}</span></div>}
              <div className="flex justify-between"><span>Shipping</span><span>{shippingFee === 0 ? 'FREE' : currency(shippingFee)}</span></div>
              <div className="flex justify-between border-t border-white/15 pt-4 text-xl font-bold text-white"><span>Total</span><span>{currency(grandTotal)}</span></div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function OrderSuccessPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    requestJson(`${API_URL}/orders/${id}`)
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Order not found');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] p-12 text-center text-black">
        <Header />
        <p className="mt-20 text-lg">Loading order confirmation...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] p-12 text-center text-black">
        <Header />
        <div className="mx-auto mt-16 max-w-md rounded-[28px] bg-white p-8 shadow-md">
          <p className="text-xl font-semibold text-red-600">Order Notice</p>
          <p className="mt-3 text-black/60">{error || 'Order details currently unavailable.'}</p>
          <Link to="/shop" className="mt-6 inline-flex rounded-full bg-black px-6 py-3 text-xs uppercase tracking-[0.2em] text-white">Back to Shop</Link>
        </div>
      </div>
    );
  }

  const addr = order.shippingAddress || {};

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-black">
      <Header />
      <main className="mx-auto max-w-[800px] px-5 py-16">
        <div className="rounded-[32px] bg-white p-8 shadow-lg md:p-12">
          <div className="text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">✓</span>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.28em] text-raw-accent">Order Confirmed</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.05em]">Thank You for Your Order</h1>
            <p className="mt-2 text-sm text-black/60">
              Order #{order.orderNumber} • Placed on {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="mt-10 grid gap-6 border-t border-black/10 pt-8 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#faf8f5] p-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Delivery Address</h3>
              <p className="mt-2 font-medium">{order.name}</p>
              <p className="text-sm text-black/70">{addr.line1}</p>
              {addr.line2 && <p className="text-sm text-black/70">{addr.line2}</p>}
              <p className="text-sm text-black/70">{addr.city}{addr.state ? `, ${addr.state}` : ''} - {addr.postalCode}</p>
              <p className="text-sm text-black/70">{addr.country || 'India'}</p>
              <p className="mt-2 text-sm text-black/70">Phone: {order.phone || addr.phone || 'N/A'}</p>
            </div>

            <div className="rounded-2xl bg-[#faf8f5] p-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Payment & Status</h3>
              <div className="mt-3 space-y-2 text-sm">
                <div>Method: <strong className="uppercase">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</strong></div>
                <div>Payment Status: <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold ${order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{order.paymentStatus}</span></div>
                <div>Order Status: <span className="inline-block rounded-md bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">{order.status}</span></div>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-black/10 pt-8">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Items Ordered</h3>
            <div className="mt-4 divide-y divide-black/10">
              {(order.items || []).map((item, idx) => (
                <div key={item.id || idx} className="flex items-center gap-4 py-4">
                  {item.image && <img src={item.image} alt={item.name} className="h-16 w-14 rounded-lg object-cover" />}
                  <div className="flex-1">
                    <p className="font-semibold text-black">{item.name}</p>
                    <p className="text-xs text-black/50">SKU: {item.sku || 'RC-ITEM'} | Size: {item.size} | Color: {item.color}</p>
                    <p className="text-xs text-black/70">Qty: {item.quantity} × {currency(item.price)}</p>
                  </div>
                  <div className="font-bold text-black">{currency(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-2 border-t border-black/10 pt-4 text-sm">
              <div className="flex justify-between text-black/70"><span>Subtotal</span><span>{currency(order.subtotal || order.total)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>−{currency(order.discount)}</span></div>}
              <div className="flex justify-between text-black/70"><span>Shipping</span><span>{order.shippingFee ? currency(order.shippingFee) : 'FREE'}</span></div>
              <div className="flex justify-between border-t border-black/10 pt-3 text-xl font-bold"><span>Total</span><span>{currency(order.total)}</span></div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link to="/shop" className="inline-flex rounded-full bg-black px-8 py-3 text-xs uppercase tracking-[0.2em] text-white shadow-md hover:bg-neutral-800">
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function CartPage({ cart, updateQuantity, removeFromCart }) {
  return (
    <div className="min-h-screen bg-[#f4f1ea] text-black">
      <Header cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} />
      <main className="mx-auto max-w-[900px] px-5 py-12 md:px-10">
        <h1 className="text-4xl font-semibold tracking-[-0.06em]">Your cart</h1>
        {!cart.length ? <div className="mt-8 rounded-[28px] bg-white p-8 text-center text-black/60 shadow-md">Your cart is empty right now.</div> : <div className="mt-8 space-y-4">{cart.map((item) => <div key={item.key} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm"><img src={item.image} alt={item.name} className="h-24 w-20 rounded-xl object-cover" /><div className="flex-1"><h2 className="font-semibold">{item.name}</h2><p className="text-sm text-black/55">{item.size} / {item.color}</p><p>{currency(item.price)}</p></div><input type="number" min="1" value={item.quantity} onChange={(event) => updateQuantity(item.key, Number(event.target.value))} className="w-16 rounded-lg border p-2" /><button onClick={() => removeFromCart(item.key)} className="text-xs uppercase tracking-[0.15em] text-red-600">Remove</button></div>)}<Link to="/checkout" className="inline-flex rounded-full bg-black px-6 py-3 text-xs uppercase tracking-[0.2em] text-white">Checkout</Link></div>}
      </main>
    </div>
  );
}

function WishlistPage({ wishlist, onWishlist, onAdd, cartCount }) {
  return <div className="min-h-screen bg-[#f4f1ea] text-black"><Header cartCount={cartCount} /><main className="mx-auto max-w-[1440px] px-5 py-12 md:px-10"><div className="flex items-end justify-between"><div><p className="text-xs uppercase tracking-[0.25em] text-black/55">Saved pieces</p><h1 className="mt-3 text-4xl font-semibold">Wishlist</h1></div><Link to="/shop" className="rounded-full border border-black/15 px-4 py-2 text-xs uppercase tracking-[0.18em]">Continue shopping</Link></div>{!wishlist.length ? <div className="mt-10 rounded-[28px] bg-white p-12 text-center text-black/60">Your wishlist is empty.</div> : <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">{wishlist.map((product) => <ProductCard key={product.id} product={product} onAdd={onAdd} onWishlist={onWishlist} wished />)}</div>}</main></div>;
}

function App() {
  const cartState = useCart();
  const wishlistState = useWishlist();
  const cartCount = cartState.cart.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <Routes>
      <Route path="/" element={<HomePage cartCount={cartCount} onAdd={cartState.addToCart} onWishlist={wishlistState.toggleWishlist} wishlist={wishlistState.wishlist} />} />
      <Route path="/shop" element={<CatalogPage cartCount={cartCount} onAdd={cartState.addToCart} onWishlist={wishlistState.toggleWishlist} wishlist={wishlistState.wishlist} />} />
      <Route path="/men" element={<CatalogPage cartCount={cartCount} onAdd={cartState.addToCart} onWishlist={wishlistState.toggleWishlist} wishlist={wishlistState.wishlist} />} />
      <Route path="/women" element={<CatalogPage cartCount={cartCount} onAdd={cartState.addToCart} onWishlist={wishlistState.toggleWishlist} wishlist={wishlistState.wishlist} />} />
      <Route path="/products/:id" element={<ProductPage cartCount={cartCount} onAdd={cartState.addToCart} onWishlist={wishlistState.toggleWishlist} wishlist={wishlistState.wishlist} />} />
      <Route path="/product/:id" element={<ProductPage cartCount={cartCount} onAdd={cartState.addToCart} onWishlist={wishlistState.toggleWishlist} wishlist={wishlistState.wishlist} />} />
      <Route path="/cart" element={<CartPage cart={cartState.cart} updateQuantity={cartState.updateQuantity} removeFromCart={cartState.removeFromCart} />} />
      <Route path="/checkout" element={<CheckoutPage cart={cartState.cart} clearCart={cartState.clearCart} />} />
      <Route path="/order-success/:id" element={<OrderSuccessPage />} />
      <Route path="/wishlist" element={<WishlistPage wishlist={wishlistState.wishlist} onWishlist={wishlistState.toggleWishlist} onAdd={cartState.addToCart} cartCount={cartCount} />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}

export default App;
