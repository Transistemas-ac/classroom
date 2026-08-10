"use client";

import { useCallback, useEffect, useState } from "react";
import useFetchPosts from "@/src/hooks/useFetchPosts";
import type { Attachment, Post, Submission, User } from "@/src/types";
import AttachmentPicker from "./AttachmentPicker";

type PostData = { submissions: Submission[]; students: User[]; loading: boolean };

function SubmissionStatus({ submission, dueDate }: { submission?: Submission; dueDate?: string | null }) {
  if (!submission) {
    return <span className="status-badge yellow">⏳ Pendiente</span>;
  }
  if (submission.graded_at) {
    return <span className="status-badge green">🏁 Calificada</span>;
  }
  const late = submission.late || (dueDate && new Date(submission.submitted_at) > new Date(dueDate));
  return late ? (
    <span className="status-badge red">🕐 Entregada tarde</span>
  ) : (
    <span className="status-badge blue">✅ Entregada</span>
  );
}

function StudentSubmissionBox({
  post,
  submission,
  onSaved,
}: {
  post: Post;
  submission?: Submission;
  onSaved: (s: Submission) => void;
}) {
  const [body, setBody] = useState(submission?.body ?? "");
  const [link, setLink] = useState(submission?.link ?? "");
  const [attachments, setAttachments] = useState<Attachment[]>(submission?.attachments ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const graded = Boolean(submission?.graded_at);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() && !link.trim() && attachments.length === 0) {
      setError("Entregá un texto o un link");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/posts/${post.id}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body || null, link: link || null, attachments }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(Array.isArray(data.errors) ? data.errors.join(", ") : data.message);
        return;
      }
      onSaved(data);
    } catch (err) {
      console.error("Error submitting:", err);
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="submission-box">
      <div className="submission-box-header">
        <span className="item-detail">
          {graded
            ? `🏁 Calificación: ${submission?.score}${post.max_score ? `/${post.max_score}` : ""} pts`
            : submission
              ? "✏️ Podés editar tu entrega hasta que te califiquen"
              : "📤 Entregá tu tarea"}
        </span>
      </div>
      {graded && submission?.feedback && (
        <div className="feedback-box">
          <span className="item-detail"><b>💬 Feedback del profe:</b> {submission.feedback}</span>
        </div>
      )}
      {!graded && (
        <form className="submission-form" onSubmit={handleSubmit}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Escribí tu respuesta..."
          />
          <div className="form-row">
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Link a tu entrega (drive, docs, etc.)"
            />
            <button type="submit" className="action-btn blue" disabled={saving}>
              {saving ? "..." : submission ? "Actualizar entrega" : "Entregar"}
            </button>
          </div>
          <AttachmentPicker attachments={attachments} onChange={setAttachments} />
          {error && <p className="form-error">{error}</p>}
        </form>
      )}
    </div>
  );
}

function GradeForm({
  submission,
  post,
  onGraded,
}: {
  submission: Submission;
  post: Post;
  onGraded: (s: Submission) => void;
}) {
  const [score, setScore] = useState(submission.score?.toString() ?? "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [rubricScores, setRubricScores] = useState<Record<string, number>>(submission.rubric_scores ?? {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleGrade = async () => {
    if (score === "") {
      setError("Ingresá un puntaje");
      return;
    }
    const num = Number(score);
    if (post.max_score && num > post.max_score) {
      setError(`Máximo ${post.max_score} pts`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/submissions/${submission.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: num, feedback: feedback || null, rubric_scores: Object.keys(rubricScores).length ? rubricScores : null }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message ?? "Error al calificar");
        return;
      }
      onGraded(data);
    } catch (err) {
      console.error("Error grading:", err);
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  if (submission.graded_at) {
    return (
      <div className="feedback-box graded">
        <span className="item-detail">
          <b>🏁 {submission.score} pts</b>
          {submission.raw_score !== null && submission.raw_score !== undefined && submission.penalty_percent ? ` (original ${submission.raw_score}, -${submission.penalty_percent}%)` : ""}
          {submission.feedback ? ` — ${submission.feedback}` : ""}
        </span>
      </div>
    );
  }

  return (
    <div className="grade-box">
      <input
        type="number"
        min="0"
        max={post.max_score ?? undefined}
        placeholder={post.max_score ? `pts (máx ${post.max_score})` : "pts"}
        value={score}
        onChange={(e) => setScore(e.target.value)}
      />
      {post.rubric && post.rubric.length > 0 && (
        <div className="rubric-score-box">
          <span className="item-detail">Rúbrica</span>
          {post.rubric.map((criterion) => (
            <label key={criterion.title}>
              {criterion.title} ({criterion.points})
              <input
                type="number"
                min="0"
                max={criterion.points}
                value={rubricScores[criterion.title] ?? ""}
                onChange={(event) => setRubricScores({ ...rubricScores, [criterion.title]: Number(event.target.value) })}
              />
            </label>
          ))}
        </div>
      )}
      <input
        type="text"
        placeholder="Feedback (opcional)"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
      />
      <button className="action-btn green" onClick={handleGrade} disabled={saving}>
        {saving ? "..." : "Calificar"}
      </button>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

function AssignmentsTab({ courseId, me }: { courseId: number; me: User }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataByPost, setDataByPost] = useState<Record<number, PostData>>({});
  const isStaff = me.credentials === "admin" || me.credentials === "teacher";

  useFetchPosts(courseId, setPosts, setLoading);

  const loadPostData = useCallback(async (postId: number) => {
    setDataByPost((prev) => ({
      ...prev,
      [postId]: { submissions: [], students: [], loading: true },
    }));
    try {
      const response = await fetch(`/api/posts/${postId}/submissions`);
      const data = await response.json();
      if (response.ok) {
        setDataByPost((prev) => ({
          ...prev,
          [postId]: {
            submissions: data.submissions ?? [],
            students: data.students ?? [],
            loading: false,
          },
        }));
      }
    } catch (err) {
      console.error("Error fetching submissions:", err);
      setDataByPost((prev) => ({
        ...prev,
        [postId]: { submissions: [], students: [], loading: false },
      }));
    }
  }, []);

  useEffect(() => {
    if (posts.length === 0) return;
    posts.forEach((p) => loadPostData(p.id));
  }, [posts, loadPostData]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner yellow"></div>
        <span>Cargando tareas...</span>
      </div>
    );
  }

  const tareas = posts.filter((p) => p.type === "tarea");

  if (tareas.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📚</div>
        <p>Todavía no hay tareas</p>
      </div>
    );
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getName = (u?: User) =>
    u
      ? u.first_name && u.last_name
        ? `${u.first_name} ${u.last_name}`
        : u.username
      : "Unknown";

  const handleSaved = (postId: number, submission: Submission) => {
    setDataByPost((prev) => {
      const data = prev[postId] ?? { submissions: [], students: [], loading: false };
      const exists = data.submissions.some((s) => s.id === submission.id);
      return {
        ...prev,
        [postId]: {
          ...data,
          submissions: exists
            ? data.submissions.map((s) => (s.id === submission.id ? submission : s))
            : [...data.submissions, submission],
        },
      };
    });
  };

  const handleGraded = (postId: number, submission: Submission) =>
    handleSaved(postId, submission);

  return (
    <div className="assignments-tab">
      <div className="post-feed">
        {tareas.map((tarea) => {
          const data = dataByPost[tarea.id];
          const ownSubmission = isStaff
            ? undefined
            : data?.submissions.find((s) => s.user_id === me.id);
          const submittedCount = data?.submissions.length ?? 0;
          const gradedCount = data?.submissions.filter((s) => s.graded_at).length ?? 0;

          return (
            <article key={tarea.id} className="post-card yellow-post">
              <div className="post-header">
                <div className="item-avatar small yellow">📝</div>
                <div className="post-meta">
                  <div className="item-header">
                    <span className="post-title">{tarea.title}</span>
                    <span className="credential-badge yellow">📝 Tarea</span>
                  </div>
                  <span className="item-detail">
                    @{tarea.author?.username} · {formatDate(tarea.created_at)}
                  </span>
                </div>
              </div>
              {tarea.body && <p className="post-body">{tarea.body}</p>}
              <div className="post-deadline">
                {tarea.due_date && (
                  <span className={`date-info ${new Date(tarea.due_date) < new Date() ? "late" : ""}`}>
                    ⏰ Entrega: {formatDate(tarea.due_date)}
                  </span>
                )}
                {tarea.max_score && (
                  <span className="date-info">🎯 Máx: {tarea.max_score} pts</span>
                )}
              </div>

              {isStaff && (
                <div className="staff-summary">
                  <span className={`status-badge blue`}>
                    📥 {submittedCount} entregas
                  </span>
                  <span className={`status-badge ${gradedCount === submittedCount ? "green" : "red"}`}>
                    🏁 {gradedCount} calificadas
                  </span>
                  {data?.loading && <span className="item-detail">Cargando...</span>}
                </div>
              )}

              {!isStaff && (
                <SubmissionStatus submission={ownSubmission} dueDate={tarea.due_date} />
              )}

              {!isStaff && (
                <StudentSubmissionBox
                  post={tarea}
                  submission={ownSubmission}
                  onSaved={(s) => handleSaved(tarea.id, s)}
                />
              )}

              {isStaff && data && !data.loading && (
                <ul className="item-list staff-submissions">
                  {data.submissions.length === 0 ? (
                    <li className="item-detail staff-submissions-empty">
                      Nadie entregó todavía
                    </li>
                  ) : (
                    data.submissions.map((s) => (
                      <li key={s.id} className="list-item subscription-item staff-submission">
                        <div className="item-avatar small blue">
                          {s.user?.username?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="item-info">
                          <div className="item-header">
                            <span className="item-name">{getName(s.user)}</span>
                            <SubmissionStatus submission={s} dueDate={tarea.due_date} />
                          </div>
                          {s.body && <span className="item-detail">{s.body.slice(0, 120)}{s.body.length > 120 ? "..." : ""}</span>}
                          {s.link && (
                            <a href={s.link} target="_blank" rel="noopener noreferrer" className="course-link">
                              🔗 Ver entrega
                            </a>
                          )}
                          {s.attachments?.map((attachment) => (
                            <a key={attachment.id ?? attachment.url} href={attachment.url} target="_blank" rel="noopener noreferrer" className="course-link">
                              📎 {attachment.name}
                            </a>
                          ))}
                          <span className="item-detail">
                            📅 {formatDate(s.submitted_at)}
                          </span>
                        </div>
                        <GradeForm
                          submission={s}
                          post={tarea}
                          onGraded={(graded) => handleGraded(tarea.id, graded)}
                        />
                      </li>
                    ))
                  )}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default AssignmentsTab;
