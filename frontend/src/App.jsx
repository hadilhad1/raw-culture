import { Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');
const currency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));

function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    fetch(`${API_URL}/products`)
      .then((res) => res.json())
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
    fetch(`${API_URL}/content/homepage`)
      .then((res) => res.json())
      .then((data) => {
        if (data) setContent({ ...content, ...data });
      })
      .catch(() => {});
  }, []);

  return content;
}

function ProductCard({ product }) {
  const [image, setImage] = useState(product.images?.[0]?.url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80');

  return (
    <motion.article initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }} className="product-card group relative overflow-hidden rounded-[26px] bg-white shadow-raw" whileHover={{ y: -6 }}>
      <div className="relative aspect-[4/5] overflow-hidden bg-[#ece7df]">
        <img src={image} alt={product.name} className="h-full w-full object-cover" onMouseEnter={() => setImage(product.images?.[1]?.url || product.images?.[0]?.url || image)} onMouseLeave={() => setImage(product.images?.[0]?.url || image)} />
        <div className="absolute left-4 top-4 flex gap-2">
          {product.newArrival && <span className="rounded-full bg-raw-lime px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-black">New</span>}
          {product.compareAtPrice && <span className="rounded-full bg-black px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">Sale</span>}
        </div>
        <button className="absolute right-4 top-4 rounded-full border border-black/10 bg-white/80 p-2 text-sm transition hover:scale-105">♡</button>
        <Link to={`/product/${product.id}`} className="absolute bottom-4 left-4 rounded-full bg-black px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white opacity-0 transition duration-300 hover:bg-raw-accent group-hover:opacity-100">Quick view</Link>
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-black/60">{product.category?.name || 'Shop'}</p>
            <h3 className="mt-1 text-lg font-medium text-black">{product.name}</h3>
          </div>
          <div className="text-right">
            <p className="text-base font-semibold text-black">{currency(product.price)}</p>
            {product.compareAtPrice && <p className="text-xs text-black/45 line-through">{currency(product.compareAtPrice)}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.15em] text-black/60">
          {(product.colors || []).slice(0, 3).map((color) => (
            <span key={color} className="rounded-full border border-black/10 px-2 py-1">{color}</span>
          ))}
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

function Header() {
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
          <Link to="/cart" className="transition hover:text-white">Cart (0)</Link>
        </div>
      </div>
    </header>
  );
}

function HomePage() {
  const { products, loading, error } = useProducts();
  const content = useHomepageContent();
  const featuredProducts = useMemo(() => (products || []).filter((product) => product.featured).slice(0, 4), [products]);
  const trendingProducts = useMemo(() => (products || []).filter((product) => product.bestSeller).slice(0, 4), [products]);

  return (
    <div className="app-shell min-h-screen text-white">
      <Header />
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
              {loading ? <div className="col-span-full rounded-full border border-black/10 bg-white px-6 py-4 text-black">Loading products...</div> : error ? <div className="col-span-full rounded-full border border-red-300 bg-red-50 px-6 py-4 text-red-700">{error}</div> : featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
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
              {(trendingProducts || []).map((product) => <ProductCard key={product.id} product={product} />)}
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

function CatalogPage() {
  const { products, loading, error } = useProducts();

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-black">
      <Header />
      <main className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-black/55">Shop all</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em]">RAW essentials</h1>
          </div>
          <div className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs uppercase tracking-[0.2em]">{(products || []).length} products</div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {loading ? <div className="col-span-full rounded-full border border-black/10 bg-white px-6 py-4">Loading products...</div> : error ? <div className="col-span-full rounded-full border border-red-300 bg-red-50 px-6 py-4 text-red-700">{error}</div> : (products || []).map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </main>
    </div>
  );
}

function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-black">
      <Header />
      <main className="mx-auto grid max-w-[1440px] gap-10 px-5 py-10 md:px-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="overflow-hidden rounded-[28px] bg-white p-4 shadow-md">
            <img src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80'} alt={product.name} className="h-[620px] w-full rounded-[20px] object-cover" />
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-[11px] uppercase tracking-[0.28em] text-black/60">{product.category?.name || 'Essential'}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em]">{product.name}</h1>
          <div className="mt-5 flex items-center gap-4">
            <span className="text-3xl font-bold">{currency(product.price)}</span>
            {product.compareAtPrice && <span className="text-lg text-black/45 line-through">{currency(product.compareAtPrice)}</span>}
          </div>
          <p className="mt-5 text-black/70">{product.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="rounded-full bg-raw-accent px-6 py-3 text-[10px] uppercase tracking-[0.22em] text-white">Add to cart</button>
            <button className="rounded-full border border-black/15 bg-white px-6 py-3 text-[10px] uppercase tracking-[0.22em] text-black">Wishlist</button>
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

function CartPage() {
  return (
    <div className="min-h-screen bg-[#f4f1ea] text-black">
      <Header />
      <main className="mx-auto max-w-[900px] px-5 py-12 md:px-10">
        <h1 className="text-4xl font-semibold tracking-[-0.06em]">Your cart</h1>
        <div className="mt-8 rounded-[28px] bg-white p-8 text-center text-black/60 shadow-md">Your cart is empty right now.</div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/shop" element={<CatalogPage />} />
      <Route path="/men" element={<CatalogPage />} />
      <Route path="/women" element={<CatalogPage />} />
      <Route path="/product/:id" element={<ProductPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}

export default App;
