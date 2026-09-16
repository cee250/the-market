import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BASE_TITLE = 'Market — Online Shopping';
const BASE_DESCRIPTION = 'Market is Rwanda’s multi-vendor marketplace for fashion, electronics, home, beauty and more.';

function metadata(pathname: string) {
  if (pathname === '/') return { title: BASE_TITLE, description: BASE_DESCRIPTION };
  if (pathname === '/shop') return { title: 'Shop products — Market', description: 'Browse products from trusted Market vendors.' };
  if (pathname.startsWith('/category/')) return { title: 'Category products — Market', description: 'Explore products in this Market category.' };
  if (pathname.startsWith('/product/')) return { title: 'Product details — Market', description: 'View product details, options and availability on Market.' };
  if (pathname.startsWith('/shop/')) return { title: 'Vendor shop — Market', description: 'Discover products from this Market vendor shop.' };
  if (pathname === '/search') return { title: 'Search results — Market', description: 'Search the Market marketplace for products and vendors.' };
  return { title: 'Market', description: BASE_DESCRIPTION };
}

export function Seo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const { title, description } = metadata(pathname);
    document.title = title;
    let descriptionTag = document.querySelector('meta[name="description"]');
    if (!descriptionTag) { descriptionTag = document.createElement('meta'); descriptionTag.setAttribute('name', 'description'); document.head.appendChild(descriptionTag); }
    descriptionTag.setAttribute('content', description);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.setAttribute('rel', 'canonical'); document.head.appendChild(canonical); }
    canonical.setAttribute('href', `${window.location.origin}${pathname}`);
  }, [pathname]);
  return null;
}
