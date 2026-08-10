"use client";

import { useCallback, useEffect, useState } from "react";
import type { AttendanceSession, User } from "@/src/types";

function AttendanceTab({ courseId, me }: { courseId: number; me: User }) {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [sessionAt, setSessionAt] = useState("");
  const isStaff = me.credentials === "admin" || me.credentials === "teacher";

  const fetchSessions = useCallback(async () => {
    const response = await fetch(`/api/course/${courseId}/attendance`);
    const data = await response.json();
    if (response.ok) setSessions(data);
    setLoading(false);
  }, [courseId]);

  useEffect(() => { void fetchSessions(); }, [fetchSessions]);

  const createSession = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch(`/api/course/${courseId}/attendance`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, session_at: new Date(sessionAt).toISOString() }) });
    const data = await response.json();
    if (response.ok) { setSessions((current) => [data, ...current]); setTitle(""); setSessionAt(""); }
  };

  const updateRecord = async (recordId: number, status: string) => {
    const response = await fetch(`/api/attendance/${recordId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (response.ok) await fetchSessions();
  };

  if (loading) return <div className="loading-container"><div className="loading-spinner blue" /><span>Cargando asistencia...</span></div>;

  return (
    <div className="attendance-tab">
      <div className="classroom-subheader"><div><h2>🧾 Asistencia</h2><span className="item-detail">Registro de presencia por encuentro</span></div></div>
      {isStaff && <form className="post-composer attendance-form" onSubmit={createSession}><div className="form-row"><div className="form-field"><label>Encuentro</label><input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Clase del martes" /></div><div className="form-field"><label>Fecha</label><input required type="datetime-local" value={sessionAt} onChange={(e) => setSessionAt(e.target.value)} /></div><button className="action-btn blue" type="submit">Crear lista</button></div></form>}
      {sessions.length === 0 ? <div className="empty-state"><div className="empty-icon">🧾</div><p>No hay encuentros registrados</p></div> : <div className="attendance-list">{sessions.map((session) => <article className="attendance-session" key={session.id}><div className="classroom-subheader"><div><h3>{session.title}</h3><span className="item-detail">{new Date(session.session_at).toLocaleString("es-AR")}</span></div><span className="count-badge blue">{session.records.length}</span></div>{session.records.map((record) => <div className="attendance-row" key={record.id}><span>{record.user?.first_name && record.user?.last_name ? `${record.user.first_name} ${record.user.last_name}` : record.user?.username ?? (record.user_id === me.id ? me.username : `ID ${record.user_id}`)}</span>{isStaff ? <select value={record.status} onChange={(e) => updateRecord(record.id, e.target.value)}><option value="present">Presente</option><option value="absent">Ausente</option><option value="late">Tarde</option><option value="excused">Justificade</option></select> : <span className={`status-badge ${record.status === "present" ? "green" : record.status === "late" ? "yellow" : "red"}`}>{record.status}</span>}</div>)}</article>)}</div>}
    </div>
  );
}

export default AttendanceTab;
