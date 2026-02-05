import { useState, useEffect } from "react";
import topicsData from "../content/blog/topics.json";

interface Topic {
  id: string;
  title: string;
  date: string;
  author: string;
}

interface Comment {
  id: string;
  text: string;
  author: string;
  date: string;
  votes: number;
}

interface BlogProps {
  onNavigateToAnimes: () => void;
}

type BlogTheme = "light" | "dark";

export default function Blog({ onNavigateToAnimes }: BlogProps) {
  const [topics, setTopics] = useState<Topic[]>(topicsData as Topic[]);
  const [newTopic, setNewTopic] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [theme, setTheme] = useState<BlogTheme>(() => {
    const saved = localStorage.getItem("blogTheme");
    return (saved === "dark" || saved === "light") ? saved : "light";
  });

  useEffect(() => {
    localStorage.setItem("blogTheme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const loadTopicComments = (topic: Topic) => {
    const key = `topicComments:${topic.id}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  };

  const getTopicCommentCount = (topicId: string) => {
    const key = `topicComments:${topicId}`;
    const saved = localStorage.getItem(key);
    const comments = saved ? JSON.parse(saved) : [];
    return comments.length;
  };

  const handleSelectTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    setComments(loadTopicComments(topic));
  };

  const handleCreateTopic = () => {
    if (newTopic.trim()) {
      const today = new Date().toISOString().split("T")[0];
      const newTopicObj: Topic = {
        id: Date.now().toString(),
        title: newTopic.trim(),
        date: today,
        author: "Tú",
      };
      
      setTopics([newTopicObj, ...topics]);
      setNewTopic("");
    }
  };

  const handleAddComment = () => {
    if (newComment.trim() && selectedTopic) {
      const today = new Date().toISOString().split("T")[0];
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        text: newComment.trim(),
        author: "Tú",
        date: today,
        votes: 0,
      };

      const updatedComments = [newCommentObj, ...comments];
      setComments(updatedComments);
      
      const key = `topicComments:${selectedTopic.id}`;
      localStorage.setItem(key, JSON.stringify(updatedComments));
      
      setNewComment("");
    }
  };

  const handleUpvote = (commentId: string) => {
    if (!selectedTopic) return;

    const updatedComments = comments.map((comment) =>
      comment.id === commentId
        ? { ...comment, votes: comment.votes + 1 }
        : comment
    );

    setComments(updatedComments);

    const key = `topicComments:${selectedTopic.id}`;
    localStorage.setItem(key, JSON.stringify(updatedComments));
  };

  const handleBackToTopics = () => {
    setSelectedTopic(null);
    setComments([]);
    setNewComment("");
  };

  return (
    <div className={`blogPage blog--${theme}`}>
      <div className="blogContainer">
        <div className="blogHeader">
          <h1 className="blogTitle">Temas de conversación</h1>
          <div className="blogHeaderActions">
            <button onClick={toggleTheme} className="themeToggle" title="Cambiar tema">
              {theme === "light" ? "🌙 Modo oscuro" : "☀️ Modo claro"}
            </button>
            <button onClick={onNavigateToAnimes} className="blogBackBtn">
              ← Volver a Animes
            </button>
          </div>
        </div>

        <div className="topicCreate">
          <input
            type="text"
            className="topicInput"
            placeholder="¿De qué querés hablar hoy?"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleCreateTopic()}
          />
          <button onClick={handleCreateTopic} className="topicCreateBtn">
            Crear tema
          </button>
        </div>

        <p className="blogSubtitle">
          {topics.length} {topics.length === 1 ? "tema" : "temas"} activos
        </p>

        {!selectedTopic ? (
          <div className="topicsList">
            {topics.map((topic) => (
              <div key={topic.id} className="topicCard">
                <div className="topicHeader">
                  <h3 className="topicTitle">{topic.title}</h3>
                  <span className="topicMeta">
                    por <strong>{topic.author}</strong> • {topic.date} • {getTopicCommentCount(topic.id)} comentarios
                  </span>
                </div>
                <button onClick={() => handleSelectTopic(topic)} className="topicJoinBtn">
                  Ver conversación →
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="topicView">
            <button onClick={handleBackToTopics} className="backToTopicsBtn">
              ← Volver a todos los temas
            </button>

            <div className="topicPost">
              <p className="topicCategory">Tema de la comunidad</p>
              <h2 className="topicViewTitle">{selectedTopic.title}</h2>
              <span className="topicViewMeta">
                Publicado por <strong>{selectedTopic.author}</strong> • {selectedTopic.date}
              </span>
            </div>

            <div className="commentsSection">
              <h3 className="commentsTitle">
                {comments.length} {comments.length === 1 ? "comentario" : "comentarios"}
              </h3>

              {comments.length === 0 ? (
                <p className="noComments">No hay comentarios todavía. ¡Sé el primero en comentar!</p>
              ) : (
                <div className="commentsList">
                  {comments.map((comment) => (
                    <div key={comment.id} className="commentCard">
                      <div className="commentHeader">
                        <div className="commentInfo">
                          <strong className="commentAuthor">{comment.author}</strong>
                          <span className="commentDate">{comment.date}</span>
                        </div>
                        <div className="commentVote">
                          <button 
                            onClick={() => handleUpvote(comment.id)} 
                            className="upvoteBtn"
                            title="Me gusta"
                          >
                            👍
                          </button>
                          <span className="voteCount">{comment.votes}</span>
                        </div>
                      </div>
                      <p className="commentText">{comment.text}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="commentCreate">
                <textarea
                  className="commentInput"
                  placeholder="Escribí tu comentario..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <button onClick={handleAddComment} className="commentSubmitBtn">
                  Enviar comentario
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
