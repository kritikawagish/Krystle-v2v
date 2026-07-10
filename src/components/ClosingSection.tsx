import { useRef, useState, MouseEvent } from "react";
import { motion, Variants } from "motion/react";
import { Play, ArrowUp } from "lucide-react";

/* ============================================================================
   CLOSING SECTION (site footer)
   ----------------------------------------------------------------------------
   Previously the landing page ended abruptly right after the scroll-reveal
   text block, with a "scroll down to discover" cue pointing at nothing below
   it and no footer at all. This component fixes that: a proper closing
   moment (word-by-word reveal headline + final CTA) followed by a minimal
   footer bar.

   Visual language (animated grid backdrop, mouse-reactive glow, drifting
   particles, word-by-word reveal) is adapted from the "digital serenity"
   reference the user shared - reimplemented with framer-motion's
   whileInView/variants instead of manual DOM mutation, and scoped to this
   section only (not global document listeners), so it behaves correctly
   inside a larger single-page app.
   ============================================================================ */

interface ClosingSectionProps {
  isDark: boolean;
  onTryDemo: () => void;
}

const headlineWords = ["Your", "safety", "shouldn't", "wait", "for", "a", "tap."];

const wordContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.1 },
  },
};

const wordItem: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

// Fixed (non-random) particle positions so layout is stable across renders
const PARTICLES = [
  { top: "20%", left: "12%", delay: "0s" },
  { top: "70%", left: "88%", delay: "0.6s" },
  { top: "35%", left: "92%", delay: "1.1s" },
  { top: "80%", left: "8%", delay: "1.6s" },
  { top: "15%", left: "50%", delay: "2.1s" },
  { top: "60%", left: "42%", delay: "0.3s" },
];

export default function ClosingSection({ isDark, onTryDemo }: ClosingSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [glow, setGlow] = useState({ x: 0, y: 0, opacity: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    setGlow({ x: e.clientX - rect.left, y: e.clientY - rect.top, opacity: 1 });
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setGlow((g) => ({ ...g, opacity: 0 }))}
      className="relative mt-16 overflow-hidden border-t border-[#1c1c1e] bg-[#020202] text-zinc-100"
    >
      {/* Mouse-reactive ambient glow, scoped to this section */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(500px circle at ${glow.x}px ${glow.y}px, rgba(255,59,48,0.10), transparent 70%)`,
          opacity: glow.opacity,
        }}
      />

      {/* Animated grid backdrop */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60" aria-hidden="true">
        <defs>
          <pattern id="closing-grid" width="56" height="56" patternUnits="userSpaceOnUse">
            <path d="M 56 0 L 0 0 0 56" fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#closing-grid)" />
        <line x1="0" y1="30%" x2="100%" y2="30%" stroke="#71717a" className="closing-grid-line" style={{ animationDelay: "0.2s" }} />
        <line x1="20%" y1="0" x2="20%" y2="100%" stroke="#71717a" className="closing-grid-line" style={{ animationDelay: "0.5s" }} />
        <line x1="80%" y1="0" x2="80%" y2="100%" stroke="#71717a" className="closing-grid-line" style={{ animationDelay: "0.8s" }} />
      </svg>

      {/* Drifting particles */}
      {PARTICLES.map((p, i) => (
        <span key={i} className="closing-particle" style={{ top: p.top, left: p.left, animationDelay: p.delay }} />
      ))}

      {/* Corner brackets */}
      <div className="hidden sm:block absolute top-6 left-6 w-8 h-8 border-l border-t border-zinc-700/60" />
      <div className="hidden sm:block absolute top-6 right-6 w-8 h-8 border-r border-t border-zinc-700/60" />
      <div className="hidden sm:block absolute bottom-28 left-6 w-8 h-8 border-l border-b border-zinc-700/60" />
      <div className="hidden sm:block absolute bottom-28 right-6 w-8 h-8 border-r border-b border-zinc-700/60" />

      {/* Closing statement + final CTA */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-24 md:py-32 flex flex-col items-center text-center gap-8">
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.5 }}
          className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#FF3B30] font-bold"
        >
          Before you go
        </motion.span>

        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.6 }}
          variants={wordContainer}
          className="text-3xl sm:text-4xl md:text-5xl font-extralight tracking-tight text-white flex flex-wrap justify-center gap-x-3"
        >
          {headlineWords.map((word, i) => (
            <motion.span key={i} variants={wordItem} className="inline-block">
              {word}
            </motion.span>
          ))}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-sm text-zinc-500 max-w-md leading-relaxed"
        >
          It should already be on your hand. Put GuardianHalo through its paces in the
          full hardware + AI simulator — no signup required.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="flex flex-wrap items-center justify-center gap-4 mt-2"
        >
          <button
            onClick={onTryDemo}
            className="px-8 py-4 bg-[#FF3B30] text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-red-600/25 hover:bg-[#D32F2F] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            TRY INTERACTIVE DEMO
          </button>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="px-8 py-4 rounded-xl border border-zinc-800 text-zinc-300 text-sm font-bold tracking-wide hover:bg-zinc-900 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <ArrowUp className="w-4 h-4" />
            BACK TO TOP
          </button>
        </motion.div>
      </div>
    </section>
  );
}
