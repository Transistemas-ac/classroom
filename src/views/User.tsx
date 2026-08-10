"use client";

import UserForm from "@/src/components/UserForm";

function User({ userId }: { userId?: number }) {
  return (
    <div className="edit-page">
      <UserForm userId={userId} />
    </div>
  );
}

export default User;
