import type { Metadata } from "next";
import { Dancing_Script, Noto_Serif, Open_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import CartHydrator from "@/components/CartHydrator";
import FlyLayer from "@/components/FlyLayer";
import SessionLoader from "@/components/SessionLoader";

const heading = Noto_Serif({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-heading",
});

const body = Open_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const script = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-script",
});

export const metadata: Metadata = {
  title: "Tan's Kitchen",
  description: "Fresh Nigerian meals, ordered online.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The site is dark on purpose. The colors and font are set here so they do not depend on globals.css.
    <html
      lang="en"
      className="scroll-smooth"
      data-scroll-behavior="smooth"
      style={{ colorScheme: "dark" }}
    >
      <body
        className={`${heading.variable} ${body.variable} ${script.variable} antialiased`}
        style={{
          background: "#0c0a09",
          color: "#f5f5f4",
          fontFamily: "var(--font-body), system-ui, sans-serif",
        }}
      >
        {/* The two font classes used around the site, defined here so they do not depend on globals.css */}
        <style>{`.font-heading{font-family:var(--font-heading),Georgia,serif}.font-script{font-family:var(--font-script),cursive}`}</style>
        <Navbar />
        {children}
        <Footer />
        <CartHydrator />
        <SessionLoader />
        <CartDrawer />
        <FlyLayer />
      </body>
    </html>
  );
}
