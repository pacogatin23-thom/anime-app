import postsData from "../content/blog/posts.json";
import BlogPostCard from "../components/BlogPostCard";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string[];
  date: string;
}

export default function Blog() {
  const posts = postsData as BlogPost[];

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Blog</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        {posts.length} {posts.length === 1 ? "post" : "posts"}
      </p>
      
      <div>
        {posts.map((post) => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
