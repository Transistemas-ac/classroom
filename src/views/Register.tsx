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
  const router = useRouter();

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "username") setUsername(value);
    if (name === "email") setEmail(value);
    if (name === "password") setPassword(value);
    if (name === "confirmPassword") setConfirmPassword(value);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      console.error("Passwords do not match");
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
        console.error("Registration error:", data.error ?? data.message);
        return;
      }

      const userData: User = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        credentials: data.user.credentials,
        pronouns: data.user.pronouns,
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        description: data.user.description,
        photo_url: data.user.photo_url,
        link: data.user.link,
        team: data.user.team,
        subscriptions: data.user.subscriptions,
        loggedIn: true,
      };

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", data.token);
      router.push("/home");
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  return (
    <div className="login">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/trans_rainbow.png" className="rainbow" alt="Arcoiris" />
      <h1>Sumate a Transistemas</h1>
      <form>
        <input
          name="username"
          value={username}
          type="text"
          placeholder="Nombre de usuario"
          onChange={onInputChange}
        />
        <input
          name="email"
          value={email}
          type="email"
          placeholder="Email"
          onChange={onInputChange}
        />
        <input
          name="password"
          value={password}
          type="password"
          placeholder="Contraseña"
          onChange={onInputChange}
        />
        <input
          name="confirmPassword"
          value={confirmPassword}
          type="password"
          placeholder="Confirmar contraseña"
          onChange={onInputChange}
        />
        <button type="submit" onClick={handleRegister}>
          Registrarse
        </button>
        <Link className="link" href="/login">
          Iniciar sesión
        </Link>
      </form>
    </div>
  );
};

export default Register;
