import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 text-white">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

      <div className="relative container-narrow mx-auto section-padding">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Free Chrome Extension
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
              Know What You&apos;re
              <br />
              <span className="text-brand-300">Agreeing To</span>
            </h1>

            <p className="text-lg sm:text-xl text-blue-100 leading-relaxed mb-8">
              PlainTerms scans Privacy Policies and Terms of Service in
              real&#8209;time. Get AI&#8209;powered red flag detection, plain
              English summaries, and reputation snapshots &mdash; before you
              click &ldquo;I&nbsp;Accept.&rdquo;
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="https://chrome.google.com/webstore/detail/plainterms/YOUR_EXTENSION_ID"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 bg-white text-brand-700 font-bold text-base px-6 py-3.5 rounded-xl hover:bg-blue-50 transition-colors shadow-lg shadow-brand-900/20"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                Add to Chrome &mdash; It&apos;s Free
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center text-white/90 hover:text-white font-semibold text-base px-6 py-3.5 rounded-xl border border-white/20 hover:border-white/40 transition-colors"
              >
                See How It Works
              </a>
            </div>

            <div className="mt-8 flex items-center gap-6 text-sm text-blue-200">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                No data collected
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Real-time analysis
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                PII auto-redacted
              </span>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-2 text-xs text-white/60">PlainTerms Side Panel</span>
              </div>

              <div className="space-y-3">
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white/80">Risk Score</span>
                    <span className="text-2xl font-bold text-yellow-400">72/100</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full" style={{ width: "72%" }} />
                  </div>
                </div>

                <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-red-300 text-xs font-bold px-1.5 py-0.5 bg-red-500/30 rounded">HIGH</span>
                    <span className="text-sm font-semibold text-white/90">Binding Arbitration</span>
                  </div>
                  <p className="text-xs text-white/60">You waive your right to sue or join a class action lawsuit...</p>
                </div>

                <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-yellow-300 text-xs font-bold px-1.5 py-0.5 bg-yellow-500/30 rounded">MED</span>
                    <span className="text-sm font-semibold text-white/90">Auto-Renewal</span>
                  </div>
                  <p className="text-xs text-white/60">Subscription renews automatically unless cancelled 30 days before...</p>
                </div>

                <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <span className="text-sm font-semibold text-white/90">GDPR Compliant</span>
                  </div>
                  <p className="text-xs text-white/60">Data deletion request honored within 30 days...</p>
                </div>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 w-24 h-24 bg-brand-400/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-brand-300/10 rounded-full blur-3xl" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}
