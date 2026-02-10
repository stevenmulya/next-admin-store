import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Admin Portal",
  description: "Secure System Login",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={jakarta.className}>
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
                success: {
                  iconTheme: { primary: 'var(--text-on-active)', secondary: 'var(--bg-active)' },
                },
                error: {
                  iconTheme: { primary: 'var(--text-on-active)', secondary: 'var(--bg-active)' },
                },
              }}
            />
            {children}
        </AuthProvider>
      </body>
    </html>
  );
}