export const SITE_URL = "https://plain-terms.app";
export const SITE_NAME = "PlainTerms";
export const SITE_DESCRIPTION =
  "Instantly understand any Privacy Policy or Terms of Service. AI-powered red flag detection, plain English summaries, and actionable insights.";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icons/logo-512.png`,
    description: SITE_DESCRIPTION,
    sameAs: [
      "https://twitter.com/plainterms",
      "https://github.com/illyanyc/plainterms",
    ],
  };
}

export function softwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "PlainTerms - Policy Analyzer",
    applicationCategory: "BrowserApplication",
    operatingSystem: "Chrome",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    image: `${SITE_URL}/icons/logo-512.png`,
  };
}

export function faqPageSchema(
  faqs: { question: string; answer: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function articleSchema(opts: {
  title: string;
  description: string;
  slug: string;
  date: string;
  author: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    description: opts.description,
    url: `${SITE_URL}/blog/${opts.slug}/`,
    datePublished: opts.date,
    author: {
      "@type": "Person",
      name: opts.author,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icons/logo-512.png`,
      },
    },
    image: opts.image || `${SITE_URL}/og-image.png`,
  };
}

export function breadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function productSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "PlainTerms Pro",
    description:
      "20 quick AI policy scans per day, 50 deep multi-agent analyses per month, reputation deep dives, policy change tracking, and priority analysis queue.",
    offers: {
      "@type": "Offer",
      price: "9.99",
      priceCurrency: "USD",
      priceValidUntil: "2027-12-31",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/#pricing`,
    },
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
  };
}
