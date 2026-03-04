import type { Metadata } from "next";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How PlainTerms collects, uses, and protects your data.",
  alternates: { canonical: `${SITE_URL}/privacy/` },
};

export default function PrivacyPage() {
  return (
    <div className="section-padding">
      <div className="container-narrow mx-auto max-w-3xl">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-3">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 mb-10">
          Last updated: March 1, 2026
        </p>

        <div className="prose prose-lg prose-blue max-w-none prose-headings:font-bold prose-headings:tracking-tight">
          <h2>Overview</h2>
          <p>
            PlainTerms (&quot;we,&quot; &quot;our,&quot; &quot;us&quot;) is a Chrome
            extension and web service that analyzes privacy policies and terms of
            service. We are committed to protecting your privacy and being
            transparent about our data practices.
          </p>

          <h2>What Data We Collect</h2>

          <h3>Data We Do NOT Collect</h3>
          <ul>
            <li>Your browsing history</li>
            <li>The URLs you visit (beyond the domain name used for analysis)</li>
            <li>Any personal information from the web pages you browse</li>
            <li>Cookies for advertising or tracking</li>
          </ul>

          <h3>Data We Process</h3>
          <ul>
            <li>
              <strong>Policy text:</strong> When you initiate an analysis, the
              text of the privacy policy or terms of service is extracted in your
              browser, PII-redacted, and sent to our servers for analysis. We do
              not permanently store this text.
            </li>
            <li>
              <strong>Anonymous client ID:</strong> A randomly generated
              identifier stored in your browser to track usage limits.
              This is not linked to your identity.
            </li>
            <li>
              <strong>Usage counts:</strong> The number of analyses you&apos;ve
              performed (to enforce tier limits). Stored server-side, linked
              only to your anonymous client ID.
            </li>
          </ul>

          <h3>Data We Collect for Paid Users</h3>
          <ul>
            <li>
              <strong>Email address:</strong> Required for Stripe billing and
              account communication only.
            </li>
            <li>
              <strong>Payment information:</strong> Processed entirely by
              Stripe. We never see or store your credit card details.
            </li>
          </ul>

          <h2>PII Redaction</h2>
          <p>
            Before any policy text leaves your browser, PlainTerms automatically
            redacts personally identifiable information (PII) including email
            addresses, phone numbers, Social Security numbers, and credit card
            numbers. An additional server-side redaction pass provides defense in
            depth.
          </p>

          <h2>How We Use Your Data</h2>
          <ul>
            <li>To provide AI-powered policy analysis</li>
            <li>To enforce usage limits per tier</li>
            <li>To process payments (Stripe)</li>
            <li>To improve our analysis accuracy (aggregated, anonymized data only)</li>
          </ul>

          <h2>Data Retention</h2>
          <ul>
            <li>
              <strong>Analysis results:</strong> Cached in memory for up to 1
              hour for performance. Not persisted to disk.
            </li>
            <li>
              <strong>Usage data:</strong> Reset daily (quick scans) or monthly
              (deep scans).
            </li>
            <li>
              <strong>Account data:</strong> Retained while your account is
              active. Deleted within 30 days of account closure upon request.
            </li>
          </ul>

          <h2>Third-Party Services</h2>
          <ul>
            <li>
              <strong>OpenAI:</strong> Policy text (PII-redacted) is sent to
              OpenAI&apos;s API for analysis. See{" "}
              <a
                href="https://openai.com/policies/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
              >
                OpenAI&apos;s Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong>Serper.dev:</strong> Company domain names are sent to
              Serper.dev to retrieve reputation data (Trustpilot, BBB). No user
              data is shared.
            </li>
            <li>
              <strong>Stripe:</strong> Payment processing. See{" "}
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Stripe&apos;s Privacy Policy
              </a>
              .
            </li>
          </ul>

          <h2>Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Request a copy of any data we hold about you</li>
            <li>Request deletion of your data</li>
            <li>Opt out of any data processing</li>
            <li>
              Lodge a complaint with a supervisory authority (for EU residents
              under GDPR)
            </li>
          </ul>

          <h2>Children&apos;s Privacy</h2>
          <p>
            PlainTerms is not directed at children under 13. We do not knowingly
            collect data from children.
          </p>

          <h2>Changes to This Policy</h2>
          <p>
            We will notify users of material changes via the extension or email
            (for paid users) at least 14 days before changes take effect.
          </p>

          <h2>Contact</h2>
          <p>
            For privacy-related questions or data requests, contact us at{" "}
            <a href="mailto:privacy@plain-terms.app">privacy@plain-terms.app</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
