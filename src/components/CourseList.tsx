"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useFetchCourses from "@/src/hooks/useFetchCourses";
import type { Course } from "@/src/types";
import { useAuthContext } from "@/src/context/AuthContext";

function CourseList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setcoursesLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isSubscribing, setIsSubscribing] = useState<number | null>(null);
  const router = useRouter();
  const { user } = useAuthContext();

  useFetchCourses(setCourses, setcoursesLoading);

  if (coursesLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner blue"></div>
        <span>Cargando cursos...</span>
      </div>
    );
  }

  const isStaff = user?.credentials === "admin" || user?.credentials === "teacher";

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getCourseStatus = (
    startDate?: string | null,
    endDate?: string | null
  ) => {
    if (!startDate) return "Activo";
    const now = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    if (now < start) return "Inscripciones Abiertas";
    if (end && now > end) return "Completado";
    return "Activo";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Activo":
        return "green";
      case "Inscripciones Abiertas":
        return "blue";
      case "Completado":
        return "red";
      default:
        return "pink";
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este curso?")) {
      setIsDeleting(courseId);
      try {
        const response = await fetch(`/api/course/${courseId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          setCourses(courses.filter((course) => course.id !== courseId));
          console.log("✅ Course deleted successfully");
        }
      } catch (error) {
        console.error("❌ Error deleting course:", error);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleToggleEnrollment = async (course: Course) => {
    if (!user) return;
    setIsSubscribing(course.id);
    try {
      const method = course.enrolled ? "DELETE" : "POST";
      const response = await fetch("/api/subscription", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          courseId: course.id,
          credentials: isStaff ? "teacher" : undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        window.alert(data.message ?? "❌ Error al actualizar la inscripción");
        return;
      }

      setCourses(
        courses.map((c) =>
          c.id === course.id ? { ...c, enrolled: !course.enrolled } : c
        )
      );
    } catch (error) {
      console.error("❌ Error updating enrollment:", error);
    } finally {
      setIsSubscribing(null);
    }
  };

  const renderCourseItem = (course: Course) => {
    const canManageCourse = Boolean(course.can_manage);
    const status = getCourseStatus(course.start_date, course.end_date);
    const statusColor = getStatusColor(status);

    return (
      <li
        key={course.id}
        className="list-item course-item"
        onClick={() => router.push(`/course/${course.id}`)}
      >
        <div className="item-avatar course-icon blue">📚</div>
        <div className="item-info">
          <div className="item-header">
            <span className="item-name">{course.title}</span>
            <span className={`status-badge ${statusColor}`}>{status}</span>
          </div>
          <span className="item-id">ID: {course.id}</span>
          {course.description && (
            <p className="course-description">{course.description}</p>
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
          {course.upcoming_due && (
            <div className="course-deadline-pill">
              <span className="status-badge yellow">
                ⏰ Próxima entrega:{" "}
                {new Date(course.upcoming_due).toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
          )}
          {isStaff && (course.pending_submissions ?? 0) > 0 && (
            <div className="course-deadline-pill">
              <span className="status-badge yellow">
                📥 {course.pending_submissions} sin entregar
              </span>
            </div>
          )}
          {isStaff && (course.pending_grades ?? 0) > 0 && (
            <div className="course-deadline-pill">
              <span className="status-badge red">
                🏁 {course.pending_grades} sin calificar
              </span>
            </div>
          )}
        </div>
        <div className="item-actions">
          {canManageCourse ? (
            <>
              <button
                className={`action-btn ${course.enrolled ? "red" : "green"}`}
                onClick={() => handleToggleEnrollment(course)}
                disabled={isSubscribing === course.id}
              >
                {course.enrolled ? "Desinscribirme" : "Inscribirme (profe)"}
              </button>
              <button
                className="action-btn yellow"
                onClick={() => router.push(`/course/${course.id}/edit`)}
              >
                Editar
              </button>
              <button
                className="action-btn red"
                onClick={() => handleDeleteCourse(course.id)}
                disabled={isDeleting === course.id}
              >
                Borrar
              </button>
            </>
          ) : isStaff ? (
            <button
              className={`action-btn ${course.enrolled ? "red" : "green"}`}
              onClick={() => handleToggleEnrollment(course)}
              disabled={isSubscribing === course.id}
            >
              {course.enrolled ? "Desinscribirme" : "Inscribirme (profe)"}
            </button>
          ) : (
            <button
              className={`action-btn ${course.enrolled ? "red" : "green"}`}
              onClick={() => handleToggleEnrollment(course)}
              disabled={isSubscribing === course.id}
            >
              {course.enrolled ? "Desinscribirse" : "Inscribirse"}
            </button>
          )}
        </div>
      </li>
    );
  };

  const enrolledCourses = courses.filter((c) => c.enrolled);
  const availableCourses = courses.filter((c) => !c.enrolled);

  return (
    <div className="list-container">
      <div className="list-header blue-header">
        <div className="header-content">
          <div className="header-title-section">
            <h2>📚 Cursos</h2>
            <span className="count-badge blue">{(courses || []).length}</span>
          </div>
          {isStaff && (
            <button
              className="add-btn-header blue"
              onClick={() => router.push("/course/new")}
            >
              +
            </button>
          )}
        </div>
      </div>

      <div className="list-content scrollable">
        {(courses || []).length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📖</div>
            <p>No se encontraron cursos</p>
            {isStaff && (
              <button
                className="add-btn blue"
                onClick={() => router.push("/course/new")}
              >
                Crear Curso
              </button>
            )}
          </div>
        ) : (
          <>
            {!isStaff && enrolledCourses.length > 0 && (
              <div className="subscription-group">
                <div className="group-header">
                  <div className="group-title-section">
                    <h3>✅ Mis cursos</h3>
                    <span className="group-count">
                      {enrolledCourses.length}
                    </span>
                  </div>
                </div>
                <ul className="item-list">
                  {enrolledCourses.map(renderCourseItem)}
                </ul>
              </div>
            )}
            {!isStaff && availableCourses.length > 0 && (
              <div className="subscription-group">
                <div className="group-header">
                  <div className="group-title-section">
                    <h3>🔓 Disponibles</h3>
                    <span className="group-count">
                      {availableCourses.length}
                    </span>
                  </div>
                </div>
                <ul className="item-list">
                  {availableCourses.map(renderCourseItem)}
                </ul>
              </div>
            )}
            {!isStaff && courses.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📖</div>
                <p>No hay cursos disponibles</p>
              </div>
            )}
            {isStaff && (
              <ul className="item-list">
                {courses.map(renderCourseItem)}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CourseList;
