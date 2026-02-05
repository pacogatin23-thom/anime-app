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
    <div className="blogPage">
      <div className="blogContainer">
        <div className="blogHeader">
          <h1 className="blogTitle">Blog</h1>
          <button onClick={onNavigateToAnimes} className="blogBackBtn">
            ← Volver a Animes
          </button>
        </div>
        <p className="blogSubtitle">
          {posts.length} {posts.length === 1 ? "post" : "posts"}
        </p>
        
        <div className="blogPosts">
          {posts.map((post) => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}
