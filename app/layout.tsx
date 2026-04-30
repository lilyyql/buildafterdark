import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-app",
});

export const metadata: Metadata = {
  title: "Smart To-Do",
  description: "Personal priority to-do — stored in your browser",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sans.variable} min-h-screen font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
