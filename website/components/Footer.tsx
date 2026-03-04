import Link from "next/link";
import Image from "next/image";

const FOOTER_LINKS = {
  Product: [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "FAQ", href: "/#faq" },
    { label: "Install Extension", href: "/chrome" },
  ],
  Resources: [
    { label: "Blog", href: "/blog" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/privacy" },
  ],
  Company: [
    { label: "GitHub", href: "https://github.com/illyanyc/plainterms" },
    { label: "Twitter", href: "https://twitter.com/plainterms" },
    { label: "Contact", href: "mailto:support@plain-terms.app" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="container-narrow mx-auto section-padding">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <Image
                src="/icons/logo-512.png"
                alt="PlainTerms"
                width={28}
                height={28}
                className="rounded-lg"
              />
              <span className="font-bold text-white">
                Plain<span className="text-brand-400">Terms</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed">
              AI-powered policy analysis for everyone. Understand what you agree
              to before you click &ldquo;I Accept.&rdquo;
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold text-white text-sm mb-3">
                {category}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    {link.href.startsWith("http") ||
                    link.href.startsWith("mailto") ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs">
            &copy; {new Date().getFullYear()} PlainTerms. All rights reserved.
          </p>
          <p className="text-xs">
            Made to protect your digital rights.
          </p>
        </div>
      </div>
    </footer>
  );
}
