"use client";

import React from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import LeftPanel from "@/components/landing/LeftPanel";
import RightScene from "@/components/landing/RightScene";
import Particles from "@/components/common/Particles";
import { motion } from "framer-motion";

export const Landing: React.FC = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Particles />
      <Header />

      <main className="relative z-20 flex min-h-screen">
        <section className="w-2/5 flex items-center justify-center p-8">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <LeftPanel />
          </motion.div>
        </section>

        <section className="w-3/5 h-screen relative">
          <motion.div initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9 }} className="absolute inset-6 glass-strong rounded-3xl overflow-hidden">
            <RightScene />
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
