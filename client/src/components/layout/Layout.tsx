import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { Seo } from './Seo';
import { AdminNavigation } from './AdminNavigation';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

/** App shell: sticky header, routed content, footer. */
export function Layout() {
  const { pathname } = useLocation();
  const isolatedAdmin = pathname.startsWith('/admin') && pathname !== '/admin/login';
  if (isolatedAdmin) return <div className="min-h-screen bg-slate-950"><ScrollToTop /><Seo />{pathname === '/admin' ? <Outlet /> : <AdminNavigation><Outlet /></AdminNavigation>}</div>;
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Seo />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
