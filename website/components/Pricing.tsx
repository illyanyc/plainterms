const TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for casual browsing protection.",
    features: [
      "Unlimited heuristic scans",
      "5 quick AI analyses per day",
      "Basic reputation badge",
      "Client-side PII redaction",
      "Real-time streaming results",
    ],
    cta: "Install Free",
    ctaHref: "https://chrome.google.com/webstore/detail/plainterms/YOUR_EXTENSION_ID",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "/month",
    description: "For power users who read the fine print.",
    features: [
      "Everything in Free, plus:",
      "20 quick AI analyses per day",
      "50 deep multi-agent analyses/month",
      "Reputation deep dives",
      "Policy change tracking",
      "Priority analysis queue",
    ],
    cta: "Get Pro",
    ctaHref: "#",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For teams and compliance departments.",
    features: [
      "Everything in Pro, plus:",
      "Unlimited quick & deep analyses",
      "Export to PDF/HTML",
      "Team management dashboard",
      "API access",
      "Custom compliance checklists",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    ctaHref: "mailto:enterprise@plain-terms.app",
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="bg-white section-padding">
      <div className="container-narrow mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-gray-600">
            Start free. Upgrade when you need deeper analysis.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-6 lg:p-8 border-2 transition-shadow ${
                tier.highlight
                  ? "border-brand-500 shadow-xl shadow-brand-100/50 scale-[1.02]"
                  : "border-gray-100 hover:border-gray-200 hover:shadow-lg"
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <h3 className="text-lg font-bold text-gray-900">{tier.name}</h3>
              <div className="mt-2 mb-1">
                <span className="text-4xl font-extrabold text-gray-900">
                  {tier.price}
                </span>
                {tier.period && (
                  <span className="text-gray-500 text-sm ml-1">
                    {tier.period}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-6">{tier.description}</p>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm text-gray-700"
                  >
                    <svg
                      className="w-4 h-4 text-brand-500 mt-0.5 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href={tier.ctaHref}
                target={tier.ctaHref.startsWith("http") ? "_blank" : undefined}
                rel={
                  tier.ctaHref.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                className={`block w-full text-center font-semibold text-sm py-3 rounded-xl transition-colors ${
                  tier.highlight
                    ? "bg-brand-600 hover:bg-brand-700 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                }`}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
