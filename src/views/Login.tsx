"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";
import type { User } from "@/src/types";

const Login = ({
  setUser,
}: {
  setUser: Dispatch<SetStateAction<User | undefined>>;
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Error al iniciar sesión");
        return;
      }

      setUser({ ...data.user, loggedIn: true });
      localStorage.setItem("user", JSON.stringify({ ...data.user, loggedIn: true }));
      router.push("/home");
    } catch (err) {
      console.error("Login error:", err);
      setError("Error de conexión");
    }
  };

  return (
    <div className="login">
      <div className="cat-container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cat.png" alt="Cat" className="svg cat" />
      </div>
      <h1>Bienvenide</h1>
      <form onSubmit={handleLogin}>
        <input
          value={username}
          type="text"
          placeholder="Nombre de usuario"
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          value={password}
          type="password"
          placeholder="Contraseña"
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="form-error">{error}</p>}
        <button type="submit">Iniciar sesión</button>
        <Link className="link" href="/forgot-password">
          Olvidé mi contraseña
        </Link>
        <Link className="link" href="/register">
          Registrarse
        </Link>
      </form>
    </div>
  );
};

export default Login;
