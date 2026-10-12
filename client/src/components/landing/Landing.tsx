"use client";

import React from "react";
import Header from "./Header";
import LeftPanel from "./LeftPanel";
import HeroCanvas from "./HeroCanvas";
import Features from "./Features";
import FloatingPortalBoard from "./FloatingPortalBoard";
import Footer from "./Footer";

export const Landing: React.FC = () => {
  return (
    <div className="relative min-h-screen w-full bg-[#E8FAF4] overflow-x-hidden flex flex-col">
      {/* ─── 1. FULLSCREEN 3D MEADOW CANVAS (HeroCanvas) ──────────── */}
      {/* Nền 3D toàn màn hình với cánh đồng cỏ và các bé thú cưng bay lơ lửng */}
      <div className="fixed inset-0 z-0 w-full h-full pointer-events-auto">
        <HeroCanvas />
      </div>

      {/* ─── 2. FLOATING 2D UI OVERLAY ────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col pointer-events-none">
        {/* Floating Header */}
        <div className="pointer-events-auto">
          <Header />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col">
          {/* ── Section 1: Hero Floating Board (LeftPanel) ── */}
          <section className="min-h-screen flex items-center pt-28 pb-16 px-4 sm:px-8 lg:px-16 max-w-7xl mx-auto w-full">
            <div className="pointer-events-auto w-full max-w-xl">
              <LeftPanel />
            </div>
          </section>

          {/* ── Section 2: Features Floating Board (Features) ── */}
          <section className="py-10 px-4 sm:px-8 max-w-7xl mx-auto w-full">
            <div className="pointer-events-auto w-full max-w-5xl mx-auto">
              <Features />
            </div>
          </section>

          {/* ── Section 3: Portal & Login / Register Floating Board ── */}
          <section className="py-10 px-4 sm:px-8 max-w-7xl mx-auto w-full">
            <div className="pointer-events-auto w-full max-w-4xl mx-auto">
              <FloatingPortalBoard />
            </div>
          </section>
        </main>

        {/* ── Section 4: Original Footer (Preserved Intact) ── */}
        <div className="pointer-events-auto mt-auto">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Landing;
