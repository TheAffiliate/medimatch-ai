import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/navbar";
import { AuthProvider } from "@/context/AuthContext";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "MediMatch AI | Intelligent Healthcare",
  description: "Connecting patients with verified doctors across Africa.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {/* Wrap everything in the React Query Provider */}
        <Providers>
          <AuthProvider>
            <Navbar />
            <main className="min-h-screen">
              {children}
            </main>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}