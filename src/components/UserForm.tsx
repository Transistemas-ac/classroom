"use client";

import type { User } from "@/src/types";

const UserForm = ({
  user,
  onEdit,
  onDelete,
}: {
  user?: User;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  if (!user) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🙍</div>
        <p>No hay usuario cargado</p>
      </div>
    );
  }

  return (
    <div className="section user-form-section">
      <div className="list-header pink-header">
        <div className="header-content">
          <h2>Perfil de Usuario</h2>
        </div>
      </div>

      <div className="list-content">
        <div className="list-item user-item">
          <div className="item-avatar pink">
            {user.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photo_url} alt={user.username} />
            ) : (
              user.username?.[0]?.toUpperCase()
            )}
          </div>

          <div className="item-info">
            <div className="item-header">
              <span className="item-name">
                {user.first_name} {user.last_name}
              </span>
              <span className="credential-badge blue">{user.credentials}</span>
            </div>
            <p className="item-detail">@{user.username}</p>
            <p className="item-detail">{user.email}</p>
            {user.description && (
              <p className="item-detail">{user.description}</p>
            )}
            {user.link && (
              <a
                href={user.link}
                target="_blank"
                rel="noopener noreferrer"
                className="course-link"
              >
                {user.link}
              </a>
            )}
          </div>

          <div className="item-actions">
            <button className="action-btn blue" onClick={onEdit}>
              Editar
            </button>
            <button className="action-btn outline danger" onClick={onDelete}>
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserForm;
