import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <AuthProvider>
            <Toaster 
              position="bottom-right" 
              toastOptions={{
                style: {
                  background: '#000000',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '500',
                  padding: '12px 20px',
                  borderRadius: '0px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                },
                success: {
                  iconTheme: { primary: '#fff', secondary: '#000' },
                },
                error: {
                  iconTheme: { primary: '#fff', secondary: '#000' },
                },
              }}
            />
            {children}
        </AuthProvider>
      </body>
    </html>
  );
}