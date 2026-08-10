"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";
import type { User } from "@/src/types";

const Register = ({
  setUser,
}: {
  setUser: Dispatch<SetStateAction<User | undefined>>;
}) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Error al registrarse");
        return;
      }

      setUser({ ...data.user, loggedIn: true });
      localStorage.setItem("user", JSON.stringify({ ...data.user, loggedIn: true }));
      router.push("/home");
    } catch (err) {
      console.error("Registration error:", err);
      setError("Error de conexión");
    }
  };

  return (
    <div className="login">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/trans_rainbow.png" className="rainbow" alt="Arcoiris" />
      <h1>Sumate a Transistemas</h1>
      <form onSubmit={handleRegister}>
        <input
          name="username"
          value={username}
          type="text"
          placeholder="Nombre de usuario"
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          name="email"
          value={email}
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          name="password"
          value={password}
          type="password"
          placeholder="Contraseña"
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          name="confirmPassword"
          value={confirmPassword}
          type="password"
          placeholder="Confirmar contraseña"
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {error && <p className="form-error">{error}</p>}
        <button type="submit">Registrarse</button>
        <Link className="link" href="/login">
          Iniciar sesión
        </Link>
      </form>
    </div>
  );
};

export default Register;
