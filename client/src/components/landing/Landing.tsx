"use client";

import React from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import LeftPanel from "@/components/landing/LeftPanel";
import HeroCanvas from "@/components/landing/HeroCanvas";
import Features from "@/components/landing/Features";
import Particles from "@/components/common/Particles";
import { motion } from "framer-motion";

export const Landing: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-navy-900 overflow-x-hidden flex flex-col">
      <Particles className="opacity-30" />
      <Header />

      <main className="relative z-20 flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col lg:flex-row relative">
          {/* Left Content */}
          <div className="w-full lg:w-5/12 flex items-center justify-center p-6 lg:p-12 pt-32 lg:pt-12 relative z-20">
            <motion.div 
              initial={{ opacity: 0, x: -40 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.8 }}
              className="w-full max-w-lg mx-auto"
            >
              <LeftPanel />
            </motion.div>
          </div>

          {/* Right 3D Scene */}
          <div className="w-full lg:w-7/12 h-[60vh] lg:h-screen relative lg:absolute lg:right-0 lg:top-0">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ duration: 1.2, delay: 0.3 }} 
              className="absolute inset-0 lg:inset-y-0 lg:left-0 lg:right-0 overflow-hidden"
            >
              {/* Overlay gradient to blend 3D scene with left panel */}
              <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-navy-900 to-transparent z-10 hidden lg:block pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-navy-900 to-transparent z-10 lg:hidden pointer-events-none" />
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-navy-900 to-transparent z-10 lg:hidden pointer-events-none" />
              
              <HeroCanvas />
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full max-w-7xl mx-auto px-6 relative z-20 pb-20">
          <Features />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
