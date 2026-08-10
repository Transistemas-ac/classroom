"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch("/api/password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.get("token"), password }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.message ?? "No se pudo actualizar la contraseña");
      return;
    }
    setMessage(data.message);
    setTimeout(() => router.push("/login"), 1200);
  };

  return (
    <div className="login">
      <h1>Nueva contraseña</h1>
      <form onSubmit={submit}>
        <input type="password" placeholder="Mínimo 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {message && <p className="form-success">{message}</p>}
        {error && <p className="form-error">{error}</p>}
        <button type="submit">Actualizar contraseña</button>
      </form>
    </div>
  );
}
