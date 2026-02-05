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
    <article className="blogPostCard">
      <h2 className="postTitle">{post.title}</h2>
      <time className="postDate">{post.date}</time>
      <p className="postExcerpt">{post.excerpt}</p>
      <div className="postTags">
        {post.tags.map((tag) => (
          <span key={tag} className="postTag">
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}
