export default function CTABanner() {
  return (
    <section className="bg-gradient-to-r from-brand-800 to-brand-600 section-padding">
      <div className="container-narrow mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
          Stop blindly clicking &ldquo;I&nbsp;Accept&rdquo;
        </h2>
        <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-8">
          Join thousands of users who read the fine print — without actually
          reading the fine print. Install PlainTerms today and take control of
          your digital rights.
        </p>
        <a
          href="https://chrome.google.com/webstore/detail/plainterms/YOUR_EXTENSION_ID"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 bg-white text-brand-700 font-bold text-base px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          Add to Chrome &mdash; It&apos;s Free
        </a>
      </div>
    </section>
  );
}
