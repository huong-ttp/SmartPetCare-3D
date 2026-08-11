import Link from "next/link";
import React from "react";

const NavItem: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <Link href={href} className="px-3 py-2 text-sm font-medium text-white/90 underline-anim">
    {children}
  </Link>
);

export const Header: React.FC = () => {
  return (
    <header className="fixed top-6 left-6 right-6 z-50 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="gradient-accent p-2 rounded-xl shadow-lg text-white font-bold">SPC</div>
        <nav className="hidden md:flex items-center gap-4">
          <NavItem href="#">Home</NavItem>
          <NavItem href="#features">Features</NavItem>
          <NavItem href="#about">About</NavItem>
          <NavItem href="#contact">Contact</NavItem>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <a className="text-sm text-white/90 underline-anim" href="#login">
          Login
        </a>
        <a className="text-sm text-white/90 underline-anim" href="#register">
          Register
        </a>
      </div>
    </header>
  );
};

export default Header;
