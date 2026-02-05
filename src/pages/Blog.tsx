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

interface BlogProps {
  onNavigateToAnimes: () => void;
}

export default function Blog({ onNavigateToAnimes }: BlogProps) {
  const posts = postsData as BlogPost[];

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1 style={{ margin: 0 }}>Blog</h1>
        <button onClick={onNavigateToAnimes} style={{ padding: "0.5rem 1rem" }}>
          ← Volver a Animes
        </button>
      </div>
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
