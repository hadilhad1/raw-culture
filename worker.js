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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (isBackendRoute(url.pathname)) {
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