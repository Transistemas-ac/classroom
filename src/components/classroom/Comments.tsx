"use client";

import { useCallback, useEffect, useState } from "react";
import type { Comment, User } from "@/src/types";

function Comments({
  postId,
  me,
  isStaff,
}: {
  postId: number;
  me: User;
  isStaff: boolean;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`);
      const data = await response.json();
      if (response.ok) setComments(data);
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (open) fetchComments();
  }, [open, fetchComments]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setPosting(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await response.json();
      if (!response.ok) {
        window.alert(data.message ?? "Error al comentar");
        return;
      }
      setBody("");
      setComments((prev) => [...prev, data]);
    } catch (err) {
      console.error("Error posting comment:", err);
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!window.confirm("¿Eliminar este comentario?")) return;
    const response = await fetch(`/api/comments/${commentId}`, {
      method: "DELETE",
    });
    if (response.ok) {
      setComments(comments.filter((c) => c.id !== commentId));
    }
  };

  if (!open) {
    return (
      <div className="comments-toggle">
        <button className="action-btn outline" onClick={() => setOpen(true)}>
          💬 Comentarios ({comments.length || "..."})
        </button>
      </div>
    );
  }

  return (
    <div className="comments-section">
      <div className="comments-header">
        <span>💬 Comentarios</span>
        <button className="action-btn outline small" onClick={() => setOpen(false)}>
          Cerrar
        </button>
      </div>

      {loading ? (
        <p className="item-detail">Cargando...</p>
      ) : comments.length === 0 ? (
        <p className="item-detail">Sin comentarios todavía</p>
      ) : (
        <ul className="comment-list">
          {comments.map((comment) => (
            <li key={comment.id} className="comment-item">
              <div className={`item-avatar small ${comment.user_id === me.id ? "green" : "blue"}`}>
                {comment.user?.username?.substring(0, 2).toUpperCase()}
              </div>
              <div className="comment-content">
                <div className="comment-meta">
                  <span className="comment-author">@{comment.user?.username}</span>
                  <span className="comment-date">
                    {new Date(comment.created_at).toLocaleString("es-AR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="comment-body">{comment.body}</p>
              </div>
              {(isStaff || comment.user_id === me.id) && (
                <button
                  className="action-btn red small"
                  onClick={() => handleDelete(comment.id)}
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form className="comment-form" onSubmit={handlePost}>
        <input
          type="text"
          placeholder="Escribí un comentario..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button type="submit" className="action-btn blue" disabled={posting || !body.trim()}>
          {posting ? "..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}

export default Comments;
