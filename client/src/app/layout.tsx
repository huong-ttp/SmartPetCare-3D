import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["vietnamese", "latin"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["vietnamese", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SmartPetCare - Hệ sinh thái chăm sóc thú cưng",
  description: "Nền tảng quản lý hồ sơ sức khỏe, lịch tiêm phòng, đặt lịch khám và kết nối với bác sĩ thú y trực tuyến dễ dàng.",
  keywords: "thú y, thú cưng, chăm sóc chó mèo, đặt lịch khám thú y, hồ sơ sức khỏe thú cưng",
  openGraph: {
    title: "SmartPetCare - Chăm sóc thú cưng thông minh",
    description: "Nền tảng quản lý hồ sơ sức khỏe và đặt lịch khám thú y.",
    type: "website",
    locale: "vi_VN",
    siteName: "SmartPetCare",
  },
  twitter: {
    card: "summary_large_image",
    title: "SmartPetCare",
    description: "Nền tảng quản lý hồ sơ sức khỏe và đặt lịch khám thú y.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} ${plusJakarta.variable}`}
    >
      <body className="min-h-screen antialiased bg-slate-50 text-slate-900 font-sans">
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}