import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SITE } from '../../config/site';

const BASE_TITLE = 'Market — Online Shopping';
const BASE_DESCRIPTION = 'Market is Rwanda’s multi-vendor marketplace for fashion, electronics, home, beauty and more.';
const PUBLIC_PATHS = ['/','/shop','/help'];

function label(value: string) { return decodeURIComponent(value).replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }

function metadata(pathname: string) {
  if (pathname === '/') return { title: BASE_TITLE, description: BASE_DESCRIPTION, indexable: true };
  if (pathname === '/shop') return { title: `Shop products — ${SITE.name}`, description: 'Browse products from trusted Market vendors.', indexable: true };
  if (pathname.startsWith('/category/')) return { title: `${label(pathname.split('/')[2] || 'Category')} products — ${SITE.name}`, description: 'Explore products in this Market category.', indexable: true };
  if (pathname.startsWith('/product/')) return { title: `Product details — ${SITE.name}`, description: 'View product details, options and availability on Market.', indexable: true };
  if (pathname.startsWith('/shop/')) return { title: `Vendor shop — ${SITE.name}`, description: 'Discover products from this Market vendor shop.', indexable: true };
  if (pathname === '/search') return { title: `Search results — ${SITE.name}`, description: 'Search the Market marketplace for products and vendors.', indexable: false };
  return { title: SITE.name, description: BASE_DESCRIPTION, indexable: PUBLIC_PATHS.includes(pathname) };
}

function setMeta(name: string, content: string, attribute = 'name') {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
  if (!tag) { tag = document.createElement('meta'); tag.setAttribute(attribute, name); document.head.appendChild(tag); }
  tag.content = content;
}

export function Seo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const { title, description, indexable } = metadata(pathname);
    document.title = title;
    setMeta('description', description);
    setMeta('og:title', title, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:type', 'website', 'property');
    setMeta('twitter:card', 'summary');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('robots', indexable ? 'index,follow' : 'noindex,nofollow');
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.setAttribute('rel', 'canonical'); document.head.appendChild(canonical); }
    canonical.setAttribute('href', `${SITE.url}${pathname || '/'}`);
  }, [pathname]);
  return null;
}
