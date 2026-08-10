"use client";

import { useState } from "react";
import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";
import type { User } from "@/src/types";

const Login = ({
  setUser,
}: {
  setUser: Dispatch<SetStateAction<User | undefined>>;
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.type === "text") setUsername(e.target.value);
    if (e.target.type === "password") setPassword(e.target.value);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
        console.error("Login error:", data.error ?? data.message);
        return;
      }

      const {
        id,
        username: dbUsername,
        email,
        credentials,
        pronouns,
        first_name,
        last_name,
        description,
        photo_url,
        link,
        team,
        subscriptions,
      } = data.user;

      const userData: User = {
        id,
        username: dbUsername,
        email,
        credentials,
        pronouns,
        first_name,
        last_name,
        description,
        photo_url,
        link,
        team,
        subscriptions,
        loggedIn: true,
      };

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", data.token);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="login">
      <div className="cat-container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cat.png" alt="Cat" className="svg cat" />
      </div>
      <h1>Bienvenide</h1>
      <form>
        <input
          value={username}
          type="text"
          placeholder="Nombre de usuario"
          onChange={onInputChange}
        />
        <input
          value={password}
          type="password"
          placeholder="Contraseña"
          onChange={onInputChange}
        />
        <button type="submit" onClick={handleLogin}>
          Iniciar sesión
        </button>
        <Link className="link" href="/register">
          Registrarse
        </Link>
      </form>
    </div>
  );
};

export default Login;
