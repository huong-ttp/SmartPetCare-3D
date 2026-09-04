import React from "react";
import { MapPin, Phone, Mail, Share2, Code, MessageCircle } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full relative z-20 py-8 px-8 mt-auto glass-dark text-slate-300 border-t border-white/10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2 text-white font-heading font-bold text-lg">
            <div className="w-6 h-6 gradient-primary rounded flex items-center justify-center text-[10px]">SPC</div>
            SmartPetCare
          </div>
          <p className="text-sm text-slate-400">© {new Date().getFullYear()} Bản quyền thuộc về SmartPetCare.</p>
        </div>

        <div className="flex flex-col items-center md:items-start gap-3 text-sm">
          <div className="flex items-center gap-2 hover:text-white transition-colors">
            <MapPin size={16} className="text-[#0EA5B7]" />
            <span>123 Đường Thú Y, Quận 1, TP. HCM</span>
          </div>
          <div className="flex items-center gap-2 hover:text-white transition-colors">
            <Phone size={16} className="text-[#0EA5B7]" />
            <a href="tel:0901234567">090 123 4567</a>
          </div>
          <div className="flex items-center gap-2 hover:text-white transition-colors">
            <Mail size={16} className="text-[#0EA5B7]" />
            <a href="mailto:hello@smartpetcare.vn">hello@smartpetcare.vn</a>
          </div>
        </div>

        <div className="flex gap-4">
          <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#0EA5B7] hover:text-white transition-all">
            <Share2 size={18} />
          </a>
          <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#0EA5B7] hover:text-white transition-all">
            <MessageCircle size={18} />
          </a>
          <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#0EA5B7] hover:text-white transition-all">
            <Code size={18} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
