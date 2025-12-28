import { useEffect } from "react";

interface MetaOptions {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonical?: string;
  robots?: string;
}

export function useDocumentMeta(options: MetaOptions) {
  const {
    title,
    description,
    ogTitle,
    ogDescription,
    ogImage,
    ogType = "website",
    twitterCard = "summary_large_image",
    twitterTitle,
    twitterDescription,
    twitterImage,
    canonical,
    robots
  } = options;

  useEffect(() => {
    // Helper to set or create meta tags
    const setMetaTag = (attr: string, attrValue: string, content: string | undefined) => {
      if (content === undefined) return;
      let tag = document.querySelector(`meta[${attr}="${attrValue}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, attrValue);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content || "");
    };

    // Set Title
    if (title) {
      document.title = title.includes("Marketing Team") ? title : `${title} | Marketing Team App`;
    }

    // Standard Meta Tags
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'robots', robots);

    // Open Graph Tags
    setMetaTag('property', 'og:title', ogTitle || title);
    setMetaTag('property', 'og:description', ogDescription || description);
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:url', window.location.href);

    // Twitter Tags
    setMetaTag('name', 'twitter:card', twitterCard);
    setMetaTag('name', 'twitter:title', twitterTitle || ogTitle || title);
    setMetaTag('name', 'twitter:description', twitterDescription || ogDescription || description);
    setMetaTag('name', 'twitter:image', twitterImage || ogImage);

    // Canonical
    if (canonical || window.location.href) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonical || window.location.href);
    }
  }, [
    title,
    description,
    ogTitle,
    ogDescription,
    ogImage,
    ogType,
    twitterCard,
    twitterTitle,
    twitterDescription,
    twitterImage,
    canonical
  ]);
}


