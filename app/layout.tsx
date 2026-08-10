import type { Metadata } from "next";
import "./globals.css";
import "@/src/styles/vars.scss";
import "@/src/styles/auth.scss";
import "@/src/styles/home.scss";
import "@/src/styles/navbar.scss";
import "@/src/styles/footer.scss";
import "@/src/styles/forms.scss";
import "@/src/styles/lists.scss";
import "@/src/styles/userForm.scss";
import "@/src/styles/classroom.scss";
import { AuthProvider } from "@/src/context/AuthContext";

export const metadata: Metadata = {
  title: "Transistemas",
  description: "Aula de Transistemas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
