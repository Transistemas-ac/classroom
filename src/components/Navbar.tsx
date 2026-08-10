"use client";

import { useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";
import type { User } from "@/src/types";

function PowerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="512"
      height="512"
      viewBox="0 0 512 512"
      className="svg power"
    >
      <path
        fill="#fff"
        d="M256 464c-114.69 0-208-93.47-208-208.35c0-62.45 27.25-121 74.76-160.55a22 22 0 1 1 28.17 33.8C113.48 160.1 92 206.3 92 255.65C92 346.27 165.57 420 256 420s164-73.73 164-164.35A164 164 0 0 0 360.17 129a22 22 0 1 1 28-33.92A207.88 207.88 0 0 1 464 255.65C464 370.53 370.69 464 256 464"
      />
      <path
        fill="#fff"
        d="M256 272a22 22 0 0 1-22-22V70a22 22 0 0 1 44 0v180a22 22 0 0 1-22 22"
      />
    </svg>
  );
}

function Navbar({
  setUser,
}: {
  setUser: Dispatch<SetStateAction<User | undefined>>;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (err) {
      console.error("Error logging out:", err);
    }
    localStorage.removeItem("user");
    setUser(undefined);
    router.push("/login");
  };

  const wrapLetters = (text: string) => {
    return text.split("").map((char, index) => <span key={index}>{char}</span>);
  };

  return (
    <div className="navbar">
      <div className="left">
        <a href={"/"}>
          <p>{wrapLetters("<Transistemas>")}</p>
        </a>
      </div>
      <div className="right">
        <button onClick={handleLogout}>
          <PowerIcon />
        </button>
      </div>
    </div>
  );
}

export default Navbar;
