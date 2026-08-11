import React from "react";
import { Button } from "@/components/ui/Button";
import GlassCard from "@/components/ui/GlassCard";
import { Mail, LogIn } from "lucide-react";

export const LeftPanel: React.FC = () => {
  return (
    <div className="w-full max-w-md px-8 py-12 relative z-20">
      <GlassCard className="backdrop-blur-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center text-white font-bold shadow">SPC</div>
          <div>
            <h1 className="text-4xl font-extrabold">SmartPetCare</h1>
            <p className="mt-2 text-sm text-white/80">Nền tảng quản lý sức khỏe thú cưng và kết nối dịch vụ thú y thông minh.</p>
          </div>
        </div>

        <p className="mt-6 text-sm text-white/80">Quản lý hồ sơ sức khỏe, lịch tiêm phòng, đặt lịch khám và kết nối với bác sĩ thú y trong một nền tảng thông minh.</p>

        <div className="mt-6 flex gap-3">
          <Button icon={<LogIn size={16} />}>
            Login
          </Button>
          <Button variant="ghost" icon={<Mail size={16} />}>
            Register
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};

export default LeftPanel;
