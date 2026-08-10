"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/src/types";
import { ROLE_COLORS, ROLE_ICONS, ROLE_LABELS } from "@/src/types";
import { useAuthContext } from "@/src/context/AuthContext";

type UserFormProps = {
  userId?: number;
};

const UserForm = ({ userId }: UserFormProps) => {
  const router = useRouter();
  const { user: me } = useAuthContext();

  const isCreate = userId === undefined;
  const isAdmin = me?.credentials === "admin";
  const isSelf = me?.id === userId;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    credentials: "student",
    pronouns: "",
    first_name: "",
    last_name: "",
    description: "",
    photo_url: "",
    link: "",
    team: "",
    email_notifications: true,
  });

  useEffect(() => {
    if (isCreate || !userId) return;
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/user/${userId}`);
        const data = await response.json();
        if (!response.ok) {
          setError(data.message ?? "Error cargando el usuarie");
          return;
        }
        setUser(data);
        setForm({
          username: data.username ?? "",
          email: data.email ?? "",
          password: "",
          credentials: data.credentials ?? "student",
          pronouns: data.pronouns ?? "",
          first_name: data.first_name ?? "",
          last_name: data.last_name ?? "",
          description: data.description ?? "",
          photo_url: data.photo_url ?? "",
          link: data.link ?? "",
          team: data.team ?? "",
          email_notifications: data.email_notifications ?? true,
        });
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Error de conexión");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [isCreate, userId]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner pink"></div>
        <span>Cargando usuarie...</span>
      </div>
    );
  }

  if (!isCreate && !user) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🙍</div>
        <p>{error || "No se encontró el usuarie"}</p>
        <button className="add-btn pink" onClick={() => router.push("/users")}>
          Volver
        </button>
      </div>
    );
  }

  const setField = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const canEdit = isCreate ? isAdmin : isSelf || isAdmin;
  const canChangeRole = isAdmin && !isSelf && !isCreate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const body: Record<string, unknown> = {
      username: form.username,
      email: form.email,
      pronouns: form.pronouns || null,
      first_name: form.first_name || null,
      last_name: form.last_name || null,
      description: form.description || null,
      photo_url: form.photo_url || null,
      link: form.link || null,
      team: form.team || null,
      email_notifications: form.email_notifications,
    };

    if (canChangeRole) body.credentials = form.credentials;
    if (form.password) body.password = form.password;

    try {
      const response = await fetch(isCreate ? "/api/user" : `/api/user/${userId}`, {
        method: isCreate ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = Array.isArray(data.errors) ? data.errors.join(", ") : data.message;
        setError(message ?? "Error al guardar");
        return;
      }

      router.push(isCreate ? "/users" : `/user/${userId}`);
      router.refresh();
    } catch (err) {
      console.error("Error saving user:", err);
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!userId) return;
    if (!window.confirm("¿Estás seguro de que quieres eliminar este usuarie?"))
      return;
    const response = await fetch(`/api/user/${userId}`, { method: "DELETE" });
    if (response.ok) {
      router.push("/users");
      router.refresh();
    } else {
      const data = await response.json().catch(() => ({}));
      setError(data.message ?? "Error al eliminar");
    }
  };

  return (
    <div className="section user-form-section">
      <div className="list-header pink-header">
        <div className="header-content">
          <div className="header-title-section">
            <h2>{isCreate ? "Nuevo usuarie" : `Perfil de @${form.username}`}</h2>
            {user && (
              <span
                className={`credential-badge ${ROLE_COLORS[user.credentials as keyof typeof ROLE_COLORS] ?? "blue"}`}
              >
                {ROLE_ICONS[user.credentials as keyof typeof ROLE_ICONS]}{" "}
                {ROLE_LABELS[user.credentials as keyof typeof ROLE_LABELS]}
              </span>
            )}
          </div>
        </div>
      </div>

      {!canEdit ? (
        <div className="list-content">
          <div className="empty-state">
            <div className="empty-icon">🔒</div>
            <p>No tenés permiso para editar este usuarie</p>
            <button className="add-btn pink" onClick={() => router.push("/home")}>
              Volver
            </button>
          </div>
        </div>
      ) : (
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Nombre de usuario</label>
            <input
              type="text"
              value={form.username}
              disabled={!isAdmin}
              onChange={(e) => setField("username", e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>
              {isCreate
                ? "Contraseña"
                : isSelf
                  ? "Nueva contraseña (opcional)"
                  : "Nueva contraseña (opcional, solo admin)"}
            </label>
            <input
              type="password"
              value={form.password}
              placeholder={isCreate ? "Mínimo 8 caracteres" : "Dejar vacío para no cambiar"}
              onChange={(e) => setField("password", e.target.value)}
            />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Nombre</label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setField("first_name", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Apellido</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setField("last_name", e.target.value)}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Pronombres</label>
              <input
                type="text"
                value={form.pronouns}
                onChange={(e) => setField("pronouns", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Equipo</label>
              <input
                type="text"
                value={form.team}
                onChange={(e) => setField("team", e.target.value)}
              />
            </div>
          </div>
          <div className="form-field">
            <label>Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Foto (URL)</label>
            <input
              type="url"
              value={form.photo_url}
              onChange={(e) => setField("photo_url", e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Link</label>
            <input
              type="url"
              value={form.link}
              onChange={(e) => setField("link", e.target.value)}
            />
          </div>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={form.email_notifications}
              onChange={(e) => setForm((current) => ({ ...current, email_notifications: e.target.checked }))}
            />
            Recibir notificaciones por email
          </label>
          {canChangeRole && (
            <div className="form-field">
              <label>Rol</label>
              <select
                value={form.credentials}
                onChange={(e) => setField("credentials", e.target.value)}
              >
                <option value="student">Estudiante</option>
                <option value="teacher">Profe</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            <button
              type="submit"
              className="action-btn blue"
              disabled={saving}
            >
              {saving ? "Guardando..." : isCreate ? "Crear usuarie" : "Guardar cambios"}
            </button>
            {isAdmin && !isSelf && !isCreate && (
              <button
                type="button"
                className="action-btn red"
                onClick={handleDelete}
              >
                Eliminar usuarie
              </button>
            )}
            <button
              type="button"
              className="action-btn outline"
              onClick={() => router.push(isCreate ? "/users" : "/home")}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default UserForm;
