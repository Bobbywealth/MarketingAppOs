export interface PageMeta {
  title: string;
  description: string;
  image?: string;
}

const DEFAULT_META: PageMeta = {
  title: "Marketing Team App | Your Remote Digital Marketing Team",
  description: "Marketing Team App is your remote digital marketing team for strategy, content, campaigns and growth. Stop wasting money on marketing that doesn't work.",
  image: "https://www.marketingteam.app/icon-512x512.png"
};

const PAGE_META_MAP: Record<string, PageMeta> = {
  "/": {
    title: "Marketing Team App | Your Remote Digital Marketing Team",
    description: "Your all-in-one platform for marketing strategy, content, and growth. Manage your brand like a pro."
  },
  "/creator-signup": {
    title: "The Creator Opportunity | Join Marketing Team",
    description: "🎥 Turn your content into a career. We're looking for elite creators to capture high-impact content for the world's fastest growing brands. Apply now to join the network.",
    image: "https://www.marketingteam.app/icon-512x512.png" 
  },
  "/signup/creator": {
    title: "Join as a Content Creator | Marketing Team",
    description: "Ready to start capturing high-impact content? Complete your application to join our elite creator network and work with top brands. 🎥✨",
    image: "https://www.marketingteam.app/icon-512x512.png" 
  },
  "/signup": {
    title: "Get Started | Marketing Team App",
    description: "Join the future of marketing. Sign up today to scale your brand with a dedicated remote digital marketing team. 🚀"
  },
  "/login": {
    title: "Login | Marketing Team App",
    description: "Welcome back. Log in to your Marketing Team dashboard to manage your growth and content."
  },
  "/auth": {
    title: "Login or Sign Up | Marketing Team App",
    description: "Access your Marketing Team dashboard. Join the elite network of brands and creators."
  },
  "/creators": {
    title: "Meet the Creators | Marketing Team App",
    description: "Explore our network of top-tier talent. Professional content that doesn't just look good—it converts. 🚀"
  },
  "/clients": {
    title: "Scale Your Brand | Marketing Team App",
    description: "Get a remote digital marketing team that actually works. We handle the strategy, content, and growth while you run your business. 📈"
  },
  "/contact": {
    title: "Contact Us | Marketing Team App",
    description: "Have questions? Let's talk about how we can grow your brand. 🤝"
  },
  "/blog": {
    title: "Marketing Insights & Strategy Blog",
    description: "Expert advice on content, campaigns, and business growth. Stay ahead of the curve. 📝"
  }
};

export function getMetaForPath(path: string): PageMeta {
  // Try to find an exact match
  if (PAGE_META_MAP[path]) {
    return PAGE_META_MAP[path];
  }

  // Handle dynamic paths or defaults
  if (path.startsWith("/blog/")) {
    return {
      title: "Marketing Insights | Blog",
      description: "Read the latest about digital marketing, content strategy, and business growth."
    };
  }

  return DEFAULT_META;
}

export function injectMetaTags(html: string, path: string): string {
  const meta = getMetaForPath(path);
  const title = meta.title.includes("Marketing Team") ? meta.title : `${meta.title} | Marketing Team App`;

  let result = html;

  // Replace Title
  result = result.replace(
    /<title>.*?<\/title>/,
    `<title>${title}</title>`
  );

  // Helper to replace or add meta tags
  const replaceMeta = (tagName: string, attr: string, attrValue: string, content: string | undefined) => {
    if (!content) return;
    
    // Flexible regex to match meta tags with attributes in any order
    const regex = new RegExp(`<meta\\s+[^>]*?${attr}="${attrValue}"[^>]*?>`, 'i');
    const newTag = `<meta ${attr}="${attrValue}" content="${content}" />`;
    
    if (regex.test(result)) {
      result = result.replace(regex, newTag);
    } else {
      // If not found, inject before </head>
      result = result.replace('</head>', `  ${newTag}\n  </head>`);
    }
  };

  // Standard Meta
  replaceMeta('meta', 'name', 'description', meta.description);

  // OG Meta
  replaceMeta('meta', 'property', 'og:title', title);
  replaceMeta('meta', 'property', 'og:description', meta.description);
  replaceMeta('meta', 'property', 'og:image', meta.image || DEFAULT_META.image);
  replaceMeta('meta', 'property', 'og:url', `https://www.marketingteam.app${path}`);

  // Twitter Meta
  replaceMeta('meta', 'name', 'twitter:title', title);
  replaceMeta('meta', 'name', 'twitter:description', meta.description);
  replaceMeta('meta', 'name', 'twitter:image', meta.image || DEFAULT_META.image);

  return result;
}

