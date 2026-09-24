import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: '📊' },
  { label: 'Products', path: '/products', icon: '👕' },
  { label: 'Add Product', path: '/products/new', icon: '➕' },
  { label: 'Categories', path: '/categories', icon: '🗂️' },
  { label: 'Collections', path: '/collections', icon: '✨' },
  { label: 'Inventory', path: '/inventory', icon: '📦' },
  { label: 'Orders', path: '/orders', icon: '🛍️' },
  { label: 'Customers', path: '/customers', icon: '👥' },
  { label: 'Content', path: '/content', icon: '📰' },
  { label: 'Media Library', path: '/media', icon: '🖼️' },
  { label: 'Videos', path: '/videos', icon: '🎬' },
  { label: 'Coupons', path: '/coupons', icon: '🏷️' },
  { label: 'Settings', path: '/settings', icon: '⚙️' },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-shell min-h-screen bg-[#111315] text-[#f5f5f5]">
      {/* Mobile Top Bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#16191c] px-4 py-3 lg:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg border border-white/15 bg-white/5 p-2 text-white hover:bg-white/10"
            aria-label="Toggle menu"
          >
            <span className="text-xl">☰</span>
          </button>
          <span className="text-sm font-black uppercase tracking-[0.18em] text-white">RAW-CULTURE ADMIN</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/60">{user?.name?.split(' ')[0] || 'Admin'}</span>
          <button
            onClick={handleLogout}
            className="rounded-full border border-white/15 px-3 py-1 text-[10px] uppercase tracking-wider text-red-300"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden w-[260px] shrink-0 flex-col justify-between border-r border-white/10 bg-[#14171a] p-6 lg:flex">
          <div>
            <div className="mb-8">
              <span className="text-xs uppercase tracking-[0.3em] text-raw-accent">Control Center</span>
              <div className="mt-1 text-lg font-black uppercase tracking-[0.18em] text-white">RAW-CULTURE</div>
            </div>

            <nav className="space-y-1.5 text-xs uppercase tracking-[0.14em]">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition ${
                      isActive
                        ? 'bg-raw-accent font-semibold text-white shadow-md'
                        : 'text-white/65 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="border-t border-white/10 pt-5">
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-raw-accent text-sm font-bold text-white">
                {user?.name?.[0] || 'A'}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-xs font-semibold text-white">{user?.name || 'Admin User'}</p>
                <p className="truncate text-[10px] text-white/50">{user?.email || 'admin@rawculture.com'}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-200 transition hover:bg-red-500/20"
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex w-[280px] max-w-xs flex-1 flex-col justify-between border-r border-white/10 bg-[#14171a] p-6 shadow-2xl">
              <div className="overflow-y-auto">
                <div className="mb-6 flex items-center justify-between">
                  <div className="text-sm font-black uppercase tracking-[0.18em]">RAW-CULTURE</div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg p-2 text-white/60 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <nav className="space-y-1.5 text-xs uppercase tracking-[0.14em]">
                  {NAV_ITEMS.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/'}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition ${
                          isActive
                            ? 'bg-raw-accent font-semibold text-white'
                            : 'text-white/65 hover:bg-white/5 hover:text-white'
                        }`
                      }
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </nav>
              </div>

              <div className="border-t border-white/10 pt-4">
                <button
                  onClick={handleLogout}
                  className="w-full rounded-full border border-red-500/30 bg-red-500/10 py-2.5 text-[10px] uppercase tracking-[0.2em] text-red-200"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden p-4 md:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
