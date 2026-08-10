"use client";

import UserForm from "@/src/components/UserForm";
import type { User as UserType } from "@/src/types";

function User({ user }: { user?: UserType }) {
  const onEdit = () => {};
  const onDelete = () => {};

  return (
    <div className="section">
      <UserForm user={user} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

export default User;
