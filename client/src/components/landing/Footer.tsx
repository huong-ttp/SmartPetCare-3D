import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-6 mt-auto text-sm text-white/80 flex items-center justify-center gap-6">
      <div>© {new Date().getFullYear()} SmartPetCare</div>
      <a href="mailto:hello@smartpetcare.example" className="underline-anim">hello@smartpetcare.example</a>
      <a href="https://facebook.com" target="_blank" rel="noreferrer" className="underline-anim">Facebook</a>
      <a href="https://github.com" target="_blank" rel="noreferrer" className="underline-anim">GitHub</a>
    </footer>
  );
};

export default Footer;
