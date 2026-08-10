"use client";

import { useCallback, useEffect, useState } from "react";
import type { CalendarEvent, User } from "@/src/types";

function CalendarTab({ courseId, me }: { courseId: number; me: User }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", starts_at: "", ends_at: "", type: "evento" });
  const [error, setError] = useState("");
  const isStaff = me.credentials === "admin" || me.credentials === "teacher";

  const fetchEvents = useCallback(async () => {
    const response = await fetch(`/api/course/${courseId}/events`);
    const data = await response.json();
    if (response.ok) setEvents(data);
    setLoading(false);
  }, [courseId]);

  useEffect(() => { void fetchEvents(); }, [fetchEvents]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const response = await fetch(`/api/course/${courseId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.message ?? "No se pudo crear el evento");
      return;
    }
    setEvents((current) => [...current, data].sort((a, b) => a.starts_at.localeCompare(b.starts_at)));
    setForm({ title: "", description: "", starts_at: "", ends_at: "", type: "evento" });
    setOpen(false);
  };

  const remove = async (eventId: number) => {
    if (!window.confirm("¿Eliminar este evento?")) return;
    const response = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
    if (response.ok) setEvents((current) => current.filter((item) => item.id !== eventId));
  };

  if (loading) return <div className="loading-container"><div className="loading-spinner purple" /><span>Cargando calendario...</span></div>;

  return (
    <div className="calendar-tab">
      <div className="classroom-subheader">
        <div><h2>🗓️ Calendario del curso</h2><span className="item-detail">Clases, entregas y eventos importantes</span></div>
        {isStaff && <button className="action-btn purple" onClick={() => setOpen(!open)}>{open ? "Cerrar" : "+ Evento"}</button>}
      </div>
      {open && isStaff && (
        <form className="post-composer" onSubmit={submit}>
          <div className="form-row">
            <div className="form-field"><label>Tipo</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="clase">Clase</option><option value="entrega">Entrega</option><option value="evento">Evento</option></select></div>
            <div className="form-field"><label>Título</label><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          </div>
          <div className="form-field"><label>Descripción</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="form-row"><div className="form-field"><label>Inicio</label><input required type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></div><div className="form-field"><label>Fin</label><input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></div></div>
          {error && <p className="form-error">{error}</p>}
          <button className="action-btn purple" type="submit">Guardar evento</button>
        </form>
      )}
      {events.length === 0 ? <div className="empty-state"><div className="empty-icon">🗓️</div><p>No hay eventos todavía</p></div> : <div className="calendar-list">{events.map((event) => <article className="calendar-event" key={event.id}><div className="calendar-event-date"><strong>{new Date(event.starts_at).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}</strong><span>{new Date(event.starts_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</span></div><div className="calendar-event-content"><span className="credential-badge purple">{event.type}</span><h3>{event.title}</h3>{event.description && <p>{event.description}</p>}</div>{isStaff && <button className="action-btn red small" onClick={() => remove(event.id)}>Quitar</button>}</article>)}</div>}
    </div>
  );
}

export default CalendarTab;
