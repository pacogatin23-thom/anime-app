interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string[];
  date: string;
}

interface BlogPostViewProps {
  post: BlogPost;
}

export default function BlogPostView({ post }: BlogPostViewProps) {
  return (
    <article style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1rem" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ marginBottom: "0.5rem" }}>{post.title}</h1>
        <p style={{ color: "#666", fontSize: "0.9rem" }}>{post.date}</p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
          {post.tags.map((tag) => (
            <span
              key={tag}
              style={{
                background: "#eee",
                padding: "0.25rem 0.5rem",
                borderRadius: "3px",
                fontSize: "0.85rem",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      <div style={{ lineHeight: "1.6", fontSize: "1rem" }}>
        {post.content.split("\n").map((paragraph, index) => (
          <p key={index} style={{ marginBottom: "1rem" }}>
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}
