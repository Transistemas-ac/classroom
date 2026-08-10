"use client";

import { useEffect, useState } from "react";
import type { Course, Subscription, User } from "@/src/types";
import { ROLE_COLORS, ROLE_LABELS } from "@/src/types";

function PeopleTab({
  course,
  onUpdated,
}: {
  course: Course;
  onUpdated: (course: Course) => void;
}) {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [addingTeacher, setAddingTeacher] = useState(false);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await fetch("/api/user");
        const data = await response.json();
        if (response.ok) setTeachers(data.filter((item: User) => item.credentials === "teacher"));
      } catch (err) {
        console.error("Error fetching teachers:", err);
      }
    };
    fetchTeachers();
  }, []);

  const refreshCourse = async () => {
    const response = await fetch(`/api/course/${course.id}`);
    const data = await response.json();
    if (response.ok) onUpdated(data);
  };

  const handleAddTeacher = async () => {
    if (!selectedTeacherId) return;
    setAddingTeacher(true);
    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(selectedTeacherId),
          courseId: course.id,
          credentials: "teacher",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        window.alert(data.message ?? "Error al inscribir profe");
        return;
      }
      setSelectedTeacherId("");
      await refreshCourse();
    } catch (err) {
      console.error("Error adding teacher:", err);
    } finally {
      setAddingTeacher(false);
    }
  };

  const handleRemove = async (subscription: Subscription) => {
    if (!window.confirm("¿Quitar a este usuarie del curso?")) return;
    const response = await fetch("/api/subscription", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: subscription.user_id,
        courseId: course.id,
      }),
    });
    if (response.ok) {
      await refreshCourse();
    } else {
      const data = await response.json().catch(() => ({}));
      window.alert(data.message ?? "Error al quitar la inscripción");
    }
  };

  const getInitials = (user?: User) => {
    if (!user) return "";
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  const subscriptions = course.subscriptions ?? [];
  const profes = subscriptions.filter((s) => s.credentials === "teacher");
  const estudiantes = subscriptions.filter((s) => s.credentials === "student");

  const renderRow = (s: Subscription) => (
    <li key={`${s.user_id}-${s.course_id}`} className="list-item subscription-item">
      <div className={`item-avatar ${ROLE_COLORS[s.credentials] ?? "blue"}`}>
        {s.user?.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.user.photo_url} alt={s.user.username} />
        ) : (
          getInitials(s.user)
        )}
      </div>
      <div className="item-info">
        <div className="item-header">
          <span className="item-name">
            {s.user?.first_name && s.user?.last_name
              ? `${s.user.first_name} ${s.user.last_name}`
              : s.user?.username}
          </span>
          <span className={`credential-badge ${ROLE_COLORS[s.credentials] ?? "blue"}`}>
            {ROLE_LABELS[s.credentials]}
          </span>
        </div>
        <span className="item-detail">@{s.user?.username}</span>
        <span className="item-detail">{s.user?.email}</span>
      </div>
      <div className="item-actions">
        <button className="action-btn red" onClick={() => handleRemove(s)}>
          Quitar
        </button>
      </div>
    </li>
  );

  return (
    <div className="people-tab">
      <div className="subscription-group">
        <div className="group-header">
          <div className="group-title-section">
            <h3>🎓 Profes</h3>
            <span className="group-count">{profes.length}</span>
          </div>
        </div>
        {profes.length === 0 ? (
          <p className="item-detail people-empty">No hay profes asignades</p>
        ) : (
          <ul className="item-list">{profes.map(renderRow)}</ul>
        )}
        {teachers.length > 0 && (
          <div className="enroll-teacher-box">
            <select
              className="role-select"
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
            >
              <option value="">Inscribir profe al curso...</option>
              {teachers
                .filter((t) => profes.every((p) => p.user_id !== t.id))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.username} ({t.email})
                  </option>
                ))}
            </select>
            <button
              className="action-btn blue"
              onClick={handleAddTeacher}
              disabled={!selectedTeacherId || addingTeacher}
            >
              {addingTeacher ? "Inscribiendo..." : "Inscribir"}
            </button>
          </div>
        )}
      </div>

      <div className="subscription-group">
        <div className="group-header">
          <div className="group-title-section">
            <h3>📚 Estudiantes</h3>
            <span className="group-count">{estudiantes.length}</span>
          </div>
        </div>
        {estudiantes.length === 0 ? (
          <p className="item-detail people-empty">No hay estudiantes inscriptes</p>
        ) : (
          <ul className="item-list">{estudiantes.map(renderRow)}</ul>
        )}
      </div>
    </div>
  );
}

export default PeopleTab;
