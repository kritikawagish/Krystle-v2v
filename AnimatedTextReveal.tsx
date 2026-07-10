import { motion, Variants } from "motion/react";

interface AnimatedTextRevealProps {
  text: string;
  variant?: "onboarding" | "emergency";
  delay?: number;
}

export default function AnimatedTextReveal({
  text,
  variant = "onboarding",
  delay = 0,
}: AnimatedTextRevealProps) {
  const words = text.split(" ");

  // Container variants to stagger children
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: delay,
      },
    },
  };

  // Word variants with visual translation and fade
  const wordVariants: Variants = {
    hidden: { 
      opacity: 0, 
      y: 12, 
      filter: "blur(4px)" 
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  // Create a stunning red-to-white gradient style for emergency, and white/silver for onboarding
  const textClass =
    variant === "emergency"
      ? "bg-linear-to-r from-red-500 via-rose-300 to-white bg-clip-text text-transparent font-extrabold tracking-tight"
      : "bg-linear-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent font-bold tracking-tight";

  return (
    <motion.span
      className={`inline-block select-none ${textClass}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          variants={wordVariants}
          className="inline-block mr-1.5 whitespace-nowrap"
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}
