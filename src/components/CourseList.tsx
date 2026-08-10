"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useFetchCourses from "@/src/hooks/useFetchCourses";
import type { Course } from "@/src/types";

function CourseList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setcoursesLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const router = useRouter();

  useFetchCourses(setCourses, setcoursesLoading);

  if (coursesLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner blue"></div>
        <span>Cargando cursos...</span>
      </div>
    );
  }

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
            Authorization: `Bearer ${localStorage.getItem("token")}`,
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

  return (
    <div className="list-container">
      <div className="list-header blue-header">
        <div className="header-content">
          <div className="header-title-section">
            <h2>📚 Cursos</h2>
            <span className="count-badge blue">{(courses || []).length}</span>
          </div>
          <button
            className="add-btn-header blue"
            onClick={() => router.push("/course/new")}
          >
            +
          </button>
        </div>
      </div>

      <div className="list-content">
        {(courses || []).length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📖</div>
            <p>No se encontraron cursos</p>
            <button
              className="add-btn blue"
              onClick={() => router.push("/course/new")}
            >
              Crear Curso
            </button>
          </div>
        ) : (
          <ul className="item-list">
            {(courses || []).map((course) => {
              const status = getCourseStatus(
                course.start_date,
                course.end_date
              );
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
                      <span className={`status-badge ${statusColor}`}>
                        {status}
                      </span>
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
                  </div>
                  <div className="item-actions">
                    <button
                      className="action-btn yellow"
                      onClick={() => router.push(`/course/${course.id}`)}
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
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default CourseList;
