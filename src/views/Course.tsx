"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/src/context/AuthContext";
import type { Course } from "@/src/types";
import ClassroomTabs, { type ClassroomTab } from "@/src/components/classroom/ClassroomTabs";
import AulaTab from "@/src/components/classroom/AulaTab";
import AssignmentsTab from "@/src/components/classroom/AssignmentsTab";
import GradebookTab from "@/src/components/classroom/GradebookTab";
import CalendarTab from "@/src/components/classroom/CalendarTab";
import AttendanceTab from "@/src/components/classroom/AttendanceTab";
import PeopleTab from "@/src/components/classroom/PeopleTab";

function Course({ courseId }: { courseId?: number }) {
  const { user } = useAuthContext();
  const router = useRouter();
  const isAdmin = user?.credentials === "admin";

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [tab, setTab] = useState<ClassroomTab>("aula");

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      return;
    }
    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/course/${courseId}`);
        const data = await response.json();
        if (!response.ok) {
          setError(data.message ?? "Error cargando el curso");
          return;
        }
        setCourse(data);
      } catch (err) {
        console.error("Error fetching course:", err);
        setError("Error de conexión");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner blue"></div>
        <span>Cargando curso...</span>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📖</div>
        <p>{error || "No se encontró el curso"}</p>
        <button className="add-btn blue" onClick={() => router.push("/home")}>
          Volver
        </button>
      </div>
    );
  }

  const isStaff = isAdmin || Boolean(course.can_manage);
  const canEnter = isStaff || course.enrolled;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleToggleEnrollment = async () => {
    if (!user) return;
    setEnrolling(true);
    try {
      const method = course.enrolled ? "DELETE" : "POST";
      const response = await fetch("/api/subscription", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          courseId: course.id,
          credentials: isStaff ? "teacher" : undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        window.alert(data.message ?? "Error al actualizar la inscripción");
        return;
      }
      setCourse({ ...course, enrolled: !course.enrolled });
    } catch (err) {
      console.error("Error updating enrollment:", err);
    } finally {
      setEnrolling(false);
    }
  };

  if (!canEnter) {
    return (
      <div className="section course-detail-section">
        <div className="list-header blue-header">
          <div className="header-content">
            <div className="header-title-section">
              <h2>📚 {course.title}</h2>
            </div>
          </div>
        </div>
        <div className="list-content">
          {course.description && (
            <p className="item-detail course-description">{course.description}</p>
          )}
          <div className="course-dates">
            {course.start_date && (
              <span className="date-info">
                📅 Inicio: {formatDate(course.start_date)}
              </span>
            )}
            {course.end_date && (
              <span className="date-info">
                🏁 Fin: {formatDate(course.end_date)}
              </span>
            )}
          </div>
          <div className="course-links">
            {course.syllabus_url && (
              <a
                href={course.syllabus_url}
                target="_blank"
                rel="noopener noreferrer"
                className="course-link"
              >
                📋 Temario
              </a>
            )}
            {course.subscription_url && (
              <a
                href={course.subscription_url}
                target="_blank"
                rel="noopener noreferrer"
                className="course-link"
              >
                🔗 Inscribirse
              </a>
            )}
          </div>
          <div className="form-actions">
            <button
              className="action-btn green"
              onClick={handleToggleEnrollment}
              disabled={enrolling}
            >
              {enrolling ? "Procesando..." : "Inscribirme"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="classroom-page">
      <header className={`classroom-header ${isStaff ? "blue-header" : "pink-header"}`}>
        <div className="classroom-title">
          <span className="classroom-icon">{isStaff ? "🎓" : "📚"}</span>
          <div>
            <h1>{course.title}</h1>
            {course.description && (
              <p className="item-detail">{course.description}</p>
            )}
            {course.start_date && (
              <p className="item-detail">
                📅 {formatDate(course.start_date)}
                {course.end_date ? ` → ${formatDate(course.end_date)}` : ""}
              </p>
            )}
          </div>
        </div>
        {!isStaff && (
          <button
            className={`action-btn ${course.enrolled ? "red" : "green"}`}
            onClick={handleToggleEnrollment}
            disabled={enrolling}
          >
            {enrolling
              ? "Procesando..."
              : course.enrolled
                ? "Desinscribirme"
            : "Inscribirme"}
          </button>
        )}
        {isStaff && (
          <button className="action-btn yellow" onClick={() => router.push(`/course/${course.id}/edit`)}>
            Editar curso
          </button>
        )}
      </header>

      <ClassroomTabs active={tab} onChange={setTab} isStaff={isStaff} />

      <div className="classroom-content">
        {tab === "aula" && user && <AulaTab courseId={course.id} me={user} />}
        {tab === "tareas" && user && <AssignmentsTab courseId={course.id} me={user} />}
        {tab === "notas" && user && <GradebookTab courseId={course.id} me={user} />}
        {tab === "calendario" && user && <CalendarTab courseId={course.id} me={user} />}
        {tab === "asistencia" && user && <AttendanceTab courseId={course.id} me={user} />}
        {tab === "personas" && isStaff && (
          <PeopleTab course={course} onUpdated={setCourse} />
        )}
      </div>
    </div>
  );
}

export default Course;
