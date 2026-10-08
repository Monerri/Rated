import type { Metadata } from "next";
import { BlogIndex } from "@/components/content/BlogIndex";

export const metadata: Metadata = {
  title: "Blog",
  description: "Practical, timely advice on improving your home in North East England.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return <BlogIndex page={1} />;
}
