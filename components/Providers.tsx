"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
      <AuthProvider>
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            style: {
              background: 'var(--bg-active)',
              color: 'var(--text-on-active)',
              fontSize: '13px',
              fontWeight: '500',
              padding: '12px 20px',
              borderRadius: '4px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid var(--border-color)'
            },
          }}
        />
        {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
      </AuthProvider>
    </ThemeProvider>
  );
}