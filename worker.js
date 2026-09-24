function isAdminRoute(pathname) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function isBackendRoute(pathname) {
  return pathname === '/api' || pathname.startsWith('/api/') || pathname === '/backend' || pathname.startsWith('/backend/');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (isBackendRoute(url.pathname)) {
      if (!env.BACKEND_URL) {
        return Response.json({ message: 'BACKEND_URL is not configured' }, { status: 503 });
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