"use client";

import React from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import LeftPanel from "@/components/landing/LeftPanel";
import HeroCanvas from "@/components/landing/HeroCanvas";
import Features from "@/components/landing/Features";
import { motion } from "framer-motion";

export const Landing: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-white overflow-x-hidden flex flex-col">
      <Header />

      <main className="relative z-10 flex-1 flex flex-col">
        {/* ─── Hero Section ─────────────────────────────────────── */}
        <section className="relative min-h-screen flex flex-col lg:flex-row overflow-hidden bg-[#E8FAF4]">

          {/* ── Left Content Panel ─────────────────────────────── */}
          <div className="relative z-20 w-full lg:w-[35%] flex items-center pt-24 pb-12 lg:pt-20 lg:pb-16 px-6 sm:px-10 lg:pl-16 xl:pl-24 lg:pr-4">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.75, ease: "easeOut" }}
              className="w-full max-w-xl"
            >
              <LeftPanel />
            </motion.div>
          </div>

          {/* ── Right 3D Scene ──────────────────────────────────── */}
          <div className="relative z-20 w-full lg:w-[65%] h-[60vh] lg:h-auto lg:absolute lg:right-0 lg:top-0 lg:bottom-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.3 }}
              className="absolute inset-0 overflow-hidden"
            >
              <HeroCanvas />
            </motion.div>
          </div>
        </section>

        {/* ── Features Section ──────────────────────────────────── */}
        <section className="w-full max-w-7xl mx-auto px-6 relative z-20 pb-20">
          <Features />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
