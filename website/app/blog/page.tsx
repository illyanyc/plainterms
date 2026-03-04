import type { Metadata } from "next";
import BlogCard from "@/components/BlogCard";
import { getAllPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Blog - Privacy & Terms of Service Insights",
  description:
    "Expert articles on privacy policies, terms of service, consumer rights, and how to protect yourself online.",
  alternates: { canonical: `${SITE_URL}/blog/` },
  openGraph: {
    title: "PlainTerms Blog",
    description:
      "Expert articles on privacy policies, terms of service, and digital consumer rights.",
    url: `${SITE_URL}/blog/`,
  },
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <div className="section-padding">
      <div className="container-narrow mx-auto max-w-4xl">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-3">
            Blog
          </h1>
          <p className="text-lg text-gray-600">
            Expert articles on privacy policies, terms of service, and how to
            protect your digital rights.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <BlogCard
              key={post.slug}
              title={post.title}
              description={post.description}
              slug={post.slug}
              date={post.date}
              readingTime={post.readingTime}
              tags={post.tags}
            />
          ))}
        </div>

        {posts.length === 0 && (
          <p className="text-gray-500 text-center py-12">
            No posts yet. Check back soon!
          </p>
        )}
      </div>
    </div>
  );
}
