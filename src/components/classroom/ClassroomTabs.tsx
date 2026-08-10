"use client";

export type ClassroomTab = "aula" | "tareas" | "notas" | "calendario" | "asistencia" | "personas";

const TABS: { id: ClassroomTab; label: string; color: string; icon: string }[] = [
  { id: "aula", label: "Aula", color: "pink", icon: "🏠" },
  { id: "tareas", label: "Tareas", color: "yellow", icon: "📚" },
  { id: "notas", label: "Notas", color: "green", icon: "📊" },
  { id: "calendario", label: "Calendario", color: "purple", icon: "🗓️" },
  { id: "asistencia", label: "Asistencia", color: "blue", icon: "🧾" },
  { id: "personas", label: "Personas", color: "blue", icon: "👥" },
];

function ClassroomTabs({
  active,
  onChange,
  isStaff,
}: {
  active: ClassroomTab;
  onChange: (tab: ClassroomTab) => void;
  isStaff: boolean;
}) {
  const tabs = isStaff ? TABS : TABS.filter((t) => t.id !== "personas");

  return (
    <nav className="classroom-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`classroom-tab ${active === tab.id ? `active ${tab.color}` : ""}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default ClassroomTabs;
