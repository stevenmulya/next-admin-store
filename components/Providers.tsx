"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
      <AuthProvider>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#333",
              color: "#fff",
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}