import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import { FAQ_DATA } from "@/lib/faq-data";
import BlogPreview from "@/components/BlogPreview";
import CTABanner from "@/components/CTABanner";
import {
  softwareApplicationSchema,
  faqPageSchema,
  productSchema,
} from "@/lib/seo";

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareApplicationSchema()),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            faqPageSchema(
              FAQ_DATA.map((f) => ({
                question: f.question,
                answer: f.answer,
              }))
            )
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema()),
        }}
      />

      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <BlogPreview />
      <CTABanner />
    </>
  );
}
