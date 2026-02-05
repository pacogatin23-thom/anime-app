interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  tags: string[];
  date: string;
}

interface BlogPostCardProps {
  post: BlogPost;
}

export default function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <article style={{ border: "1px solid #ddd", padding: "1rem", marginBottom: "1rem", borderRadius: "4px" }}>
      <h2>{post.title}</h2>
      <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "0.5rem" }}>{post.date}</p>
      <p>{post.excerpt}</p>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
        {post.tags.map((tag) => (
          <span key={tag} style={{ background: "#eee", padding: "0.25rem 0.5rem", borderRadius: "3px", fontSize: "0.85rem" }}>
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}
