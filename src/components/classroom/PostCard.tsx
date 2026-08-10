"use client";

import { useState } from "react";
import type { Post, User } from "@/src/types";
import { POST_TYPE_COLORS, POST_TYPE_ICONS, POST_TYPE_LABELS } from "@/src/types";
import Comments from "./Comments";

function PostCard({
  post,
  me,
  isStaff,
  onDeleted,
  onUpdated,
}: {
  post: Post;
  me: User;
  isStaff: boolean;
  onDeleted: (postId: number) => void;
  onUpdated: (post: Post) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: post.title,
    body: post.body ?? "",
  });

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isLate = post.due_date && new Date(post.due_date) < new Date();

  const handleDelete = async () => {
    if (!window.confirm("¿Eliminar este post?")) return;
    const response = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    if (response.ok) onDeleted(post.id);
    else {
      const data = await response.json().catch(() => ({}));
      window.alert(data.message ?? "Error al eliminar");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, body: form.body || null }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message ?? "Error al guardar");
        return;
      }
      setEditing(false);
      onUpdated({ ...post, ...data });
    } catch (err) {
      console.error("Error updating post:", err);
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const color = POST_TYPE_COLORS[post.type];

  return (
    <article className={`post-card ${color}-post`}>
      <div className="post-header">
        <div className={`item-avatar small ${color}`}>
          {post.author?.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.author.photo_url} alt={post.author.username} />
          ) : (
            post.author?.username?.substring(0, 2).toUpperCase()
          )}
        </div>
        <div className="post-meta">
          <div className="item-header">
            <span className="post-title">{post.title}</span>
            <span className={`credential-badge ${color}`}>
              {POST_TYPE_ICONS[post.type]} {POST_TYPE_LABELS[post.type]}
            </span>
          </div>
          <span className="item-detail">
            @{post.author?.username} · {formatDate(post.created_at)}
          </span>
        </div>
        {isStaff && (
          <div className="item-actions">
            <button className="action-btn outline small" onClick={() => setEditing(!editing)}>
              {editing ? "✕" : "✏️"}
            </button>
            <button className="action-btn red small" onClick={handleDelete}>
              🗑️
            </button>
          </div>
        )}
      </div>

      {editing && isStaff ? (
        <form className="post-edit-form" onSubmit={handleUpdate}>
          <div className="form-field">
            <label>Título</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="form-field">
            <label>Texto</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button type="submit" className="action-btn blue" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      ) : (
        <>
          {post.body && <p className="post-body">{post.body}</p>}
          {post.type === "tarea" && (
            <div className="post-deadline">
              <span className={`date-info ${isLate ? "late" : ""}`}>
                ⏰ Entrega: {formatDate(post.due_date)}{" "}
                {isLate ? "· 🕐 Vencida" : ""}
              </span>
              {post.max_score && (
                <span className="date-info">🎯 Máx: {post.max_score} pts</span>
              )}
            </div>
          )}
          {post.publish_at && new Date(post.publish_at) > new Date() && (
            <span className="status-badge purple">🗓️ Programado</span>
          )}
          {post.is_published === false && (
            <span className="status-badge purple">📝 Borrador</span>
          )}
          {post.attachments && post.attachments.length > 0 && (
            <ul className="post-attachments">
              {post.attachments.map((attachment) => (
                <li key={attachment.id ?? attachment.url}>
                  <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                    📎 {attachment.name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Comments postId={post.id} me={me} isStaff={isStaff} />
    </article>
  );
}

export default PostCard;
