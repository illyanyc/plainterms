import Link from "next/link";

interface BlogCardProps {
  title: string;
  description: string;
  slug: string;
  date: string;
  readingTime: string;
  tags: string[];
}

export default function BlogCard({
  title,
  description,
  slug,
  date,
  readingTime,
  tags,
}: BlogCardProps) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="group block bg-white rounded-2xl border border-gray-100 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-100/50 transition-all duration-300 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          {tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
        <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-brand-700 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2">
          {description}
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <time dateTime={date}>{new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</time>
          <span>&middot;</span>
          <span>{readingTime}</span>
        </div>
      </div>
    </Link>
  );
}
