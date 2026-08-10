"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useFetchUsers from "@/src/hooks/useFetchUsers";
import { useAuthContext } from "@/src/context/AuthContext";
import type { User } from "@/src/types";
import { ROLE_COLORS, ROLE_ICONS, ROLE_LABELS } from "@/src/types";

function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState<number | null>(null);
  const router = useRouter();
  const { user: loggedUser } = useAuthContext();

  useFetchUsers(setUsers, setUsersLoading);

  if (usersLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner pink"></div>
        <span className="loading-text">Cargando usuaries...</span>
      </div>
    );
  }

  const getInitials = (
    firstName?: string | null,
    lastName?: string | null,
    username?: string
  ) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return (username || "").substring(0, 2).toUpperCase();
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este usuarie?")) {
      setIsDeleting(userId);
      try {
        const response = await fetch(`/api/user/${userId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          setUsers(users.filter((user) => user.id !== userId));
          console.log("✅ User deleted successfully");
        } else {
          const data = await response.json().catch(() => ({}));
          window.alert(data.message ?? "❌ Error eliminando usuarie");
        }
      } catch (error) {
        console.error("❌ Error deleting user:", error);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleRoleChange = async (user: User, newRole: string) => {
    if (newRole === user.credentials) return;
    setIsUpdatingRole(user.id);
    try {
      const response = await fetch(`/api/user/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credentials: newRole }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        window.alert(data.message ?? "❌ Error cambiando el rol");
        return;
      }

      setUsers(
        users.map((u) =>
          u.id === user.id
            ? { ...u, credentials: newRole as User["credentials"] }
            : u
        )
      );
    } catch (error) {
      console.error("❌ Error updating role:", error);
    } finally {
      setIsUpdatingRole(null);
    }
  };

  const sortedUsers = loggedUser
    ? [...users].sort((a, b) => {
        if (a.id === loggedUser.id) return -1;
        if (b.id === loggedUser.id) return 1;
        return 0;
      })
    : users;

  return (
    <div className="list-container">
      <div
        className="list-header pink-header"
        onClick={() => router.push("/users")}
      >
        <div className="header-content">
          <div className="header-title-section">
            <h2>🐱 Usuaries</h2>
            <span className="count-badge pink">{users.length}</span>
          </div>
          <button
            className="add-btn-header pink"
            onClick={() => router.push("/user/new")}
          >
            +
          </button>
        </div>
        <div className="header-stats">
          <span className="stat-item purple">
            Profes: {users.filter((u) => u.credentials === "teacher").length}
          </span>
          <span className="stat-item blue">
            Estudiantes:{" "}
            {users.filter((u) => u.credentials === "student").length}
          </span>
          <span className="stat-item green">
            Admins: {users.filter((u) => u.credentials === "admin").length}
          </span>
        </div>
      </div>
      <div className="list-content">
        {users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <p>No se encontraron usuaries</p>
            <button
              className="add-btn pink"
              onClick={() => router.push("/user/new")}
            >
              Agregar usuarie
            </button>
          </div>
        ) : (
          <ul className="item-list">
            {sortedUsers.map((user) => (
              <li
                key={user.id}
                className="list-item user-item"
                onClick={() => router.push(`/user/${user.id}`)}
              >
                <div
                  className={`item-avatar ${ROLE_COLORS[user.credentials] ?? "blue"}`}
                >
                  {user.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.photo_url} alt={user.username} />
                  ) : (
                    getInitials(
                      user.first_name,
                      user.last_name,
                      user.username
                    )
                  )}
                </div>
                <div className="item-info">
                  <div className="item-header">
                    <span className="item-name">{user.username}</span>
                    <span
                      className={`credential-badge ${ROLE_COLORS[user.credentials] ?? "blue"}`}
                    >
                      {ROLE_ICONS[user.credentials] ?? "📚"}{" "}
                      {ROLE_LABELS[user.credentials] ?? "Estudiante"}
                    </span>
                  </div>
                  <span className="item-id">ID: {user.id}</span>
                  <span className="item-detail">{user.email}</span>
                  {user.team && (
                    <span className="item-detail">🏢 {user.team}</span>
                  )}
                  {user.pronouns && (
                    <span className="item-detail">({user.pronouns})</span>
                  )}
                </div>
                <div className="item-actions">
                  {loggedUser?.id === user.id ? (
                    <span className="item-detail">(vos)</span>
                  ) : (
                    <select
                      className="role-select"
                      value={user.credentials}
                      disabled={isUpdatingRole === user.id}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleRoleChange(user, e.target.value)}
                    >
                      <option value="student">Estudiante</option>
                      <option value="teacher">Profe</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                  <button
                    className="action-btn yellow"
                    onClick={() => router.push(`/user/${user.id}`)}
                  >
                    Editar
                  </button>
                  {loggedUser?.id !== user.id && (
                    <button
                      className="action-btn red"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={isDeleting === user.id}
                    >
                      Borrar
                    </button>
                  )}
                  {user.link && (
                    <a
                      href={user.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="action-btn outline"
                    >
                      🔗 Link
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default UserList;
