"use client";

import { useState } from "react";
import useFetchGrades, { type GradebookData } from "@/src/hooks/useFetchGrades";
import type { User } from "@/src/types";

function GradebookTab({ courseId, me }: { courseId: number; me: User }) {
  const [data, setData] = useState<GradebookData | null>(null);
  const [loading, setLoading] = useState(true);
  const isStaff = me.credentials === "admin" || me.credentials === "teacher";

  useFetchGrades(courseId, setData, setLoading);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner green"></div>
        <span>Cargando notas...</span>
      </div>
    );
  }

  if (!data || data.tareas.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📊</div>
        <p>Todavía no hay tareas para calificar</p>
      </div>
    );
  }

  const getName = (u?: { first_name?: string | null; last_name?: string | null; username: string }) =>
    u
      ? u.first_name && u.last_name
        ? `${u.first_name} ${u.last_name}`
        : u.username
      : "Unknown";

  const subFor = (userId: number, postId: number) =>
    data.submissions.find((s) => s.user_id === userId && s.post_id === postId);

  const studentTotal = (userId: number) => {
    const subs = data.submissions.filter((s) => s.user_id === userId && s.score !== null);
    const maxes = data.tareas
      .filter((t) => t.max_score)
      .reduce((acc, t) => acc + (t.max_score ?? 0), 0);
    const earned = subs.reduce((acc, s) => acc + (s.score ?? 0), 0);
    return { earned, maxes };
  };

  return (
    <div className="gradebook">
      <div className="gradebook-toolbar">
        <div>
          <h2>📊 Libro de notas</h2>
          <span className="item-detail">Resultados por estudiante y tarea</span>
        </div>
        {isStaff && (
          <a
            className="action-btn green"
            href={`/api/course/${courseId}/grades/pdf`}
            download
          >
            Descargar PDF
          </a>
        )}
      </div>
      <div className="gradebook-table-wrap">
        <table className="gradebook-table">
          <thead>
            <tr>
              <th className="gradebook-name-col">Estudiante</th>
              {data.tareas.map((t) => (
                <th key={t.id} title={t.title}>
                  {t.title.slice(0, 14)}
                  {t.title.length > 14 ? "…" : ""}
                  {t.max_score ? ` (${t.max_score})` : ""}
                </th>
              ))}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {isStaff
              ? data.students.map((student) => {
                  const { earned, maxes } = studentTotal(student.id);
                  return (
                    <tr key={student.id}>
                      <td className="gradebook-name-col">
                        <span className="gradebook-name">{getName(student)}</span>
                        <span className="item-detail">@{student.username}</span>
                      </td>
                      {data.tareas.map((t) => {
                        const s = subFor(student.id, t.id);
                        return (
                          <td key={t.id}>
                            {s ? (
                              <div className={`grade-cell ${s.graded_at ? "graded" : ""}`}>
                                <span className="grade-score">
                                  {s.score !== null ? s.score : "—"}
                                  {s.score !== null && t.max_score ? `/${t.max_score}` : ""}
                                </span>
                                {s.feedback && (
                                  <span className="grade-feedback" title={s.feedback}>
                                    💬
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="grade-missing">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="grade-total">
                        {maxes > 0 ? `${earned}/${maxes}` : "—"}
                      </td>
                    </tr>
                  );
                })
              : (() => {
                  const { earned, maxes } = studentTotal(me.id);
                  return (
                    <tr>
                      <td className="gradebook-name-col">
                        <span className="gradebook-name">Tu promedio</span>
                        <span className="item-detail">@{me.username}</span>
                      </td>
                      {data.tareas.map((t) => {
                        const s = subFor(me.id, t.id);
                        return (
                          <td key={t.id}>
                            {s ? (
                              <div className={`grade-cell ${s.graded_at ? "graded" : ""}`}>
                                <span className="grade-score">
                                  {s.score !== null ? s.score : "En revisión"}
                                </span>
                                {s.score !== null && t.max_score ? `/${t.max_score}` : ""}
                                {s.feedback && (
                                  <span className="grade-feedback" title={s.feedback}>
                                    💬
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="grade-missing">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="grade-total">
                        {maxes > 0 ? `${earned}/${maxes}` : "—"}
                      </td>
                    </tr>
                  );
                })()}
          </tbody>
        </table>
      </div>
      {!isStaff && (
        <p className="item-detail gradebook-note">
          💡 Las notas con feedback aparecen marcadas con 💬. Pasá el mouse para leerlo.
        </p>
      )}
    </div>
  );
}

export default GradebookTab;
