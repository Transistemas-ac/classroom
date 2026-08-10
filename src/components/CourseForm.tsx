"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Course } from "@/src/types";

type CourseFormProps = {
  courseId?: number;
};

const CourseForm = ({ courseId }: CourseFormProps) => {
  const router = useRouter();
  const isCreate = courseId === undefined;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    syllabus_url: "",
    subscription_url: "",
    status: "active",
    allow_late_submissions: true,
    late_penalty_percent: "",
  });

  useEffect(() => {
    if (isCreate || !courseId) return;
    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/course/${courseId}`);
        const data = await response.json();
        if (!response.ok) {
          setError(data.message ?? "Error cargando el curso");
          return;
        }
        setCourse(data);
        setForm({
          title: data.title ?? "",
          description: data.description ?? "",
          start_date: data.start_date ? data.start_date.slice(0, 16) : "",
          end_date: data.end_date ? data.end_date.slice(0, 16) : "",
          syllabus_url: data.syllabus_url ?? "",
          subscription_url: data.subscription_url ?? "",
          status: data.status ?? "active",
          allow_late_submissions: data.allow_late_submissions ?? true,
          late_penalty_percent: data.late_penalty_percent?.toString() ?? "",
        });
      } catch (err) {
        console.error("Error fetching course:", err);
        setError("Error de conexión");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [isCreate, courseId]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner blue"></div>
        <span>Cargando curso...</span>
      </div>
    );
  }

  if (!isCreate && !course) {
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

  const setField = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const body = {
      title: form.title,
      description: form.description || null,
      start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      syllabus_url: form.syllabus_url || null,
      subscription_url: form.subscription_url || null,
      status: form.status,
      allow_late_submissions: form.allow_late_submissions,
      late_penalty_percent: form.late_penalty_percent ? Number(form.late_penalty_percent) : null,
    };

    try {
      const response = await fetch(
        isCreate ? "/api/course" : `/api/course/${courseId}`,
        {
          method: isCreate ? "POST" : "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = Array.isArray(data.errors)
          ? data.errors.join(", ")
          : data.message;
        setError(message ?? "Error al guardar");
        return;
      }

      router.push(isCreate ? "/home" : `/course/${courseId}`);
      router.refresh();
    } catch (err) {
      console.error("Error saving course:", err);
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="section course-form-section">
      <div className="list-header blue-header">
        <div className="header-content">
          <div className="header-title-section">
            <h2>{isCreate ? "Nuevo curso" : `Editar: ${course?.title}`}</h2>
          </div>
        </div>
      </div>
      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label>Título</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
          />
        </div>
        <div className="form-row">
          <div className="form-field">
            <label>Estado</label>
            <select value={form.status} onChange={(e) => setField("status", e.target.value)}>
              <option value="active">Activo</option>
              <option value="archived">Archivado</option>
            </select>
          </div>
          <div className="form-field">
            <label>Penalización por entrega tarde (%)</label>
            <input type="number" min="0" max="100" value={form.late_penalty_percent} onChange={(e) => setField("late_penalty_percent", e.target.value)} />
          </div>
        </div>
        <label className="checkbox-field">
          <input type="checkbox" checked={form.allow_late_submissions} onChange={(e) => setForm((current) => ({ ...current, allow_late_submissions: e.target.checked }))} />
          Aceptar entregas fuera de término
        </label>
        <div className="form-field">
          <label>Descripción</label>
          <textarea
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
          />
        </div>
        <div className="form-row">
          <div className="form-field">
            <label>Fecha de inicio</label>
            <input
              type="datetime-local"
              value={form.start_date}
              onChange={(e) => setField("start_date", e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Fecha de fin</label>
            <input
              type="datetime-local"
              value={form.end_date}
              onChange={(e) => setField("end_date", e.target.value)}
            />
          </div>
        </div>
        <div className="form-field">
          <label>Temario (URL)</label>
          <input
            type="url"
            value={form.syllabus_url}
            onChange={(e) => setField("syllabus_url", e.target.value)}
          />
        </div>
        <div className="form-field">
          <label>Link de inscripción (URL)</label>
          <input
            type="url"
            value={form.subscription_url}
            onChange={(e) => setField("subscription_url", e.target.value)}
          />
        </div>
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="submit" className="action-btn blue" disabled={saving}>
            {saving ? "Guardando..." : isCreate ? "Crear curso" : "Guardar cambios"}
          </button>
          <button
            type="button"
            className="action-btn outline"
            onClick={() => router.push("/home")}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseForm;
