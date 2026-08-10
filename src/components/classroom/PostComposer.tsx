"use client";

import { useState } from "react";
import type { Attachment, Post, PostType, RubricCriterion } from "@/src/types";
import { POST_TYPE_COLORS, POST_TYPE_ICONS, POST_TYPE_LABELS } from "@/src/types";
import AttachmentPicker from "./AttachmentPicker";

function PostComposer({
  courseId,
  onCreated,
}: {
  courseId: number;
  onCreated: (post: Post) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [type, setType] = useState<PostType>("anuncio");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [publishAt, setPublishAt] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [rubric, setRubric] = useState<RubricCriterion[]>([]);

  if (!open) {
    return (
      <div className="post-composer-toggle">
        <button className="add-btn pink" onClick={() => setOpen(true)}>
          ✏️ Nuevo post
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("El título es obligatorio");
      return;
    }
    setSaving(true);
    setError("");

    const payload: Record<string, unknown> = {
      type,
      title,
      body: body || null,
      is_published: isPublished,
      publish_at: publishAt ? new Date(publishAt).toISOString() : null,
      attachments,
    };
    if (type === "tarea") {
      payload.due_date = dueDate ? new Date(dueDate).toISOString() : null;
      payload.max_score = maxScore ? Number(maxScore) : null;
      payload.rubric = rubric.length ? rubric : null;
    }

    try {
      const response = await fetch(`/api/course/${courseId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(Array.isArray(data.errors) ? data.errors.join(", ") : data.message);
        return;
      }
      setTitle("");
      setBody("");
      setDueDate("");
      setMaxScore("");
      setIsPublished(true);
      setPublishAt("");
      setAttachments([]);
      setRubric([]);
      setOpen(false);
      onCreated(data);
    } catch (err) {
      console.error("Error creating post:", err);
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="post-composer">
      <div className="post-composer-header">
        <span className="credential-badge pink">✏️ Nuevo post</span>
        <button
          className="action-btn outline small"
          onClick={() => setOpen(false)}
        >
          ✕
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-field">
            <label>Tipo</label>
            <select value={type} onChange={(e) => setType(e.target.value as PostType)}>
              {(Object.keys(POST_TYPE_LABELS) as PostType[]).map((t) => (
                <option key={t} value={t}>
                  {POST_TYPE_ICONS[t]} {POST_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </div>
        <div className="form-field">
          <label>Texto</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="¿Qué querés compartir?"
          />
        </div>
        {type === "tarea" && (
          <div className="form-row">
            <div className="form-field">
              <label>Fecha de entrega</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Puntaje máximo</label>
              <input
                type="number"
                min="1"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
              />
            </div>
          </div>
        )}
        <div className="form-row">
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            Publicar inmediatamente
          </label>
          <div className="form-field">
            <label>Programar publicación (opcional)</label>
            <input
              type="datetime-local"
              value={publishAt}
              onChange={(e) => setPublishAt(e.target.value)}
            />
          </div>
        </div>
        {type === "tarea" && (
          <div className="rubric-editor">
            <div className="rubric-editor-header">
              <label>Rúbrica (opcional)</label>
              <button
                type="button"
                className="action-btn outline small"
                onClick={() => setRubric([...rubric, { title: "", description: "", points: 1 }])}
              >
                + Criterio
              </button>
            </div>
            {rubric.map((criterion, index) => (
              <div className="rubric-row" key={index}>
                <input
                  placeholder="Criterio"
                  value={criterion.title}
                  onChange={(e) => setRubric(rubric.map((item, i) => i === index ? { ...item, title: e.target.value } : item))}
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Puntos"
                  value={criterion.points}
                  onChange={(e) => setRubric(rubric.map((item, i) => i === index ? { ...item, points: Number(e.target.value) } : item))}
                />
                <button
                  type="button"
                  className="action-btn red small"
                  onClick={() => setRubric(rubric.filter((_, i) => i !== index))}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}
        <AttachmentPicker attachments={attachments} onChange={setAttachments} />
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button
            type="submit"
            className={`action-btn ${POST_TYPE_COLORS[type]}`}
            disabled={saving}
          >
            {saving ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PostComposer;
