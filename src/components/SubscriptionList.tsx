"use client";

import { useState } from "react";
import useFetchSubscriptions from "@/src/hooks/useFetchSubscriptions";
import type { Subscription, User } from "@/src/types";

function SubscriptionList() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);

  useFetchSubscriptions(setSubscriptions, setSubscriptionsLoading);

  if (subscriptionsLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner yellow"></div>
        <span>Cargando inscripciones...</span>
      </div>
    );
  }

  const getCredentialColor = (credentials: string) => {
    return credentials === "teacher" ? "purple" : "blue";
  };

  const getInitials = (user?: User) => {
    if (!user) return "";
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(
        0
      )}`.toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (user?: User) => {
    if (!user) return "Unknown";
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username;
  };

  const groupedSubscriptions = subscriptions.reduce<Record<string, Subscription[]>>(
    (groups, subscription) => {
      const courseTitle = subscription.course?.title || "Unknown Course";
      if (!groups[courseTitle]) {
        groups[courseTitle] = [];
      }
      groups[courseTitle].push(subscription);
      return groups;
    },
    {}
  );

  return (
    <div className="list-container subscription-list">
      <div className="list-header yellow-header">
        <div className="header-content">
          <div className="header-title-section">
            <h2>⭐ Inscripciones</h2>
            <span className="count-badge yellow">{subscriptions.length}</span>
          </div>
          <button className="add-btn-header yellow">+</button>
        </div>
      </div>

      <div className="list-content scrollable">
        {subscriptions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p>No se encontraron inscripciones</p>
            <button className="add-btn yellow">Crear Inscripción</button>
          </div>
        ) : (
          <div className="subscription-groups">
            {Object.entries(groupedSubscriptions).map(
              ([courseTitle, courseSubscriptions]) => (
                <div key={courseTitle} className="subscription-group">
                  <div className="group-header">
                    <div className="group-title-section">
                      <h3>📚 {courseTitle}</h3>
                      <span className="group-count">
                        {courseSubscriptions.length}
                      </span>
                    </div>
                  </div>
                  <ul className="item-list">
                    {courseSubscriptions.map((subscription) => (
                      <li
                        key={`${subscription.user_id}-${subscription.course_id}`}
                        className="list-item subscription-item"
                      >
                        <div
                          className={`item-avatar ${getCredentialColor(
                            subscription.credentials
                          )}`}
                        >
                          {subscription.user?.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={subscription.user.photo_url}
                              alt={getDisplayName(subscription.user)}
                            />
                          ) : (
                            getInitials(subscription.user)
                          )}
                        </div>
                        <div className="item-info">
                          <div className="item-header">
                            <span className="item-name">
                              {getDisplayName(subscription.user)}
                            </span>
                            <span
                              className={`credential-badge ${getCredentialColor(
                                subscription.credentials
                              )}`}
                            >
                              {subscription.credentials === "teacher"
                                ? "🎓"
                                : "📚"}{" "}
                              {subscription.credentials === "teacher"
                                ? "Profe"
                                : "Estudiante"}
                            </span>
                          </div>
                          <span className="item-detail">
                            @{subscription.user?.username}
                          </span>
                          {subscription.user?.email && (
                            <span className="item-detail">
                              {subscription.user.email}
                            </span>
                          )}
                          {subscription.user?.team && (
                            <span className="item-detail">
                              {subscription.user.team}
                            </span>
                          )}
                        </div>
                        <div className="subscription-actions">
                          <div className="item-actions">
                            <button className="action-btn yellow">
                              Editar
                            </button>
                            <button className="action-btn red">Borrar</button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SubscriptionList;
