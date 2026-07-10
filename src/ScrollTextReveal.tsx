import { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "motion/react";

interface ScrollTextRevealProps {
  text: string;
  isDark?: boolean;
}

interface WordProps {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  isDark?: boolean;
}

function Word({ children, progress, range, isDark = true }: WordProps) {
  // Map scroll progress to word properties
  const opacity = useTransform(progress, range, [0.15, 1]);
  const y = useTransform(progress, range, [8, 0]);
  const filter = useTransform(progress, range, ["blur(2px)", "blur(0px)"]);
  
  // High craftsmanship coloring:
  // When active (revealed), highlight words in bright white or glowing red accent.
  const activeColor = "text-white dark:text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]";
  const inactiveColor = isDark ? "text-zinc-800" : "text-slate-300";

  return (
    <motion.span
      style={{ opacity, y, filter }}
      className="inline-block relative font-bold tracking-tight transition-all duration-300 mr-[0.25em]"
    >
      <span className={activeColor}>{children}</span>
    </motion.span>
  );
}

export default function ScrollTextReveal({ text, isDark = true }: ScrollTextRevealProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // useScroll offsets: ["start end", "end start"]
  // "start end" means the top of the container enters the bottom of the viewport
  // "end start" means the bottom of the container leaves the top of the viewport
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "end 55%"],
  });

  const words = text.split(" ");

  return (
    <div 
      ref={containerRef} 
      className={`relative py-32 px-6 flex flex-col items-center justify-center min-h-[45vh] overflow-hidden rounded-[32px] border transition-colors duration-300 ${
        isDark 
          ? "bg-[#070708] border-[#18181b]/50" 
          : "bg-white border-slate-200/80 shadow-md shadow-slate-100/30"
      }`}
    >
      {/* Decorative ambient glowing lines */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-[#FF3B30] to-transparent"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#FF3B30]/5 rounded-full filter blur-3xl"></div>
      </div>

      {/* Discover scrolling cue */}
      <div className="flex flex-col items-center gap-1.5 mb-8 text-[9px] font-mono tracking-widest uppercase text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FF3B30]"></span>
          </span>
          Scroll down to discover
        </span>
        <motion.span
          animate={{ y: [0, 4, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="text-[#FF3B30] font-bold"
        >
          ↓
        </motion.span>
      </div>

      <div className="max-w-4xl mx-auto text-center z-10">
        <p className="text-2xl md:text-4xl font-extrabold tracking-tight leading-relaxed md:leading-normal flex flex-wrap justify-center text-zinc-300 dark:text-zinc-600">
          {words.map((word, i) => {
            const start = i / words.length;
            const end = (i + 1) / words.length;
            return (
              <Word 
                key={`${word}-${i}`} 
                progress={scrollYProgress} 
                range={[start, end]} 
                isDark={isDark}
              >
                {word}
              </Word>
            );
          })}
        </p>
      </div>
    </div>
  );
}
