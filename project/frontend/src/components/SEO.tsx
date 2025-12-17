import { useEffect } from 'react';

type SEOProps = {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  url?: string;
};

function upsertMeta(nameOrProperty: { name?: string; property?: string }, content: string | undefined) {
  if (!content) return;
  const selector = nameOrProperty.name
    ? `meta[name="${nameOrProperty.name}"]`
    : `meta[property="${nameOrProperty.property}"]`;
  let tag = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    if (nameOrProperty.name) tag.setAttribute('name', nameOrProperty.name);
    if (nameOrProperty.property) tag.setAttribute('property', nameOrProperty.property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertLink(rel: string, href: string | undefined) {
  if (!href) return;
  let link = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export default function SEO({ title, description, canonical, image, url }: SEOProps) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) upsertMeta({ name: 'description' }, description);
    if (canonical) upsertLink('canonical', canonical);

    // Open Graph
    if (title) upsertMeta({ property: 'og:title' }, title);
    if (description) upsertMeta({ property: 'og:description' }, description);
    if (url) upsertMeta({ property: 'og:url' }, url);
    if (image) upsertMeta({ property: 'og:image' }, image);

    // Twitter
    if (title) upsertMeta({ name: 'twitter:title' }, title);
    if (description) upsertMeta({ name: 'twitter:description' }, description);
    if (image) upsertMeta({ name: 'twitter:image' }, image);
  }, [title, description, canonical, image, url]);

  return null;
}


