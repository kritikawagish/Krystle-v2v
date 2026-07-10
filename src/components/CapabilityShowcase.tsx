import { useEffect, useState, ElementType, ComponentType, ReactNode } from "react";
import { motion } from "motion/react";
import { Zap, Sparkles, Compass, Database, Mic, Lock, UserCheck, ArrowRight } from "lucide-react";

/* ============================================================================
   CAPABILITY SHOWCASE
   ----------------------------------------------------------------------------
   Renders the "PIONEERING CAPABILITIES" section of the landing page.
   Each capability animates into view one at a time as the user scrolls
   (via framer-motion's `whileInView`), and is paired with a small "live
   preview" panel that mirrors the look of the matching section inside the
   actual GuardianHalo simulator (Wearable Core, Environmental Threat AI,
   CrowdShield Radar, and Evidence Vault) so visitors can see exactly where
   each capability lives before they ever open the simulator themselves.
   ============================================================================ */

interface CapabilityShowcaseProps {
  isDark: boolean;
  onTryDemo: () => void;
}

interface Capability {
  id: string;
  icon: ElementType;
  title: string;
  simulatorTag: string;
  description: string;
  preview: ComponentType<{ isDark: boolean }>;
}

/* ---------- Shared "device frame" wrapper so every preview reads as a
   captured snapshot of the simulator rather than a random illustration ---------- */
function SimulatorFrame({
  isDark,
  label,
  children,
}: {
  isDark: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-[28px] border overflow-hidden shadow-2xl transition-colors duration-300 ${
        isDark ? "bg-[#0a0a0a] border-[#222]" : "bg-white border-slate-200"
      }`}
    >
      {/* Fake window chrome so it visually reads as a "captured screen" */}
      <div
        className={`flex items-center gap-2 px-4 py-2.5 border-b ${
          isDark ? "border-[#1c1c1c] bg-[#111]" : "border-slate-100 bg-slate-50"
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-red-400/70" />
        <span className="w-2 h-2 rounded-full bg-amber-400/70" />
        <span className="w-2 h-2 rounded-full bg-emerald-400/70" />
        <span
          className={`ml-2 text-[9px] font-mono uppercase tracking-wider ${
            isDark ? "text-zinc-500" : "text-slate-400"
          }`}
        >
          Live from simulator &middot; {label}
        </span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ---------- 1. Discrete Squeezes preview (mirrors Wearable Core tab) ---------- */
function SqueezePatternPreview({ isDark }: { isDark: boolean }) {
  const fullPattern = ["Short", "Short", "Short", "Long"];
  const [step, setStep] = useState(0);
  const [matched, setMatched] = useState(false);

  useEffect(() => {
    const tick = setInterval(() => {
      setStep((s) => {
        if (matched) return s;
        if (s + 1 > fullPattern.length) return 0;
        return s + 1;
      });
    }, 550);
    return () => clearInterval(tick);
  }, [matched]);

  useEffect(() => {
    if (step === fullPattern.length) {
      setMatched(true);
      const reset = setTimeout(() => {
        setMatched(false);
        setStep(0);
      }, 1400);
      return () => clearTimeout(reset);
    }
  }, [step]);

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative w-28 h-28 flex items-center justify-center">
        <div
          className={`absolute w-28 h-28 rounded-full border-4 transition-all duration-300 ${
            matched ? "border-red-500/80" : step > 0 ? "border-amber-400/80" : isDark ? "border-[#222]" : "border-slate-200"
          }`}
        />
        <svg width="80" height="80" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="#18181b" stroke="#27272a" strokeWidth="3" />
          <circle cx="50" cy="50" r="41" fill="none" stroke={isDark ? "#09090b" : "#cbd5e1"} strokeWidth="1" strokeDasharray="3,3" />
          <circle cx="50" cy="50" r="30" fill={isDark ? "#09090b" : "#f1f5f9"} stroke="#1c1917" strokeWidth="2" />
          <circle cx="50" cy="14" r="4" fill={matched ? "#ef4444" : step > 0 ? "#fbbf24" : "#10b981"} className="animate-pulse" />
          <path d="M 12,50 A 38,38 0 0,1 21,24" fill="none" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" opacity="0.3" />
          <path d="M 88,50 A 38,38 0 0,0 79,24" fill="none" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" opacity="0.3" />
        </svg>
      </div>

      <div className="flex items-center gap-1.5">
        {fullPattern.map((type, idx) => {
          const isFilled = idx < step;
          return (
            <span
              key={idx}
              className={`px-2 py-1 rounded font-mono text-[9px] font-bold border transition-all duration-200 ${
                !isFilled
                  ? isDark
                    ? "bg-transparent border-[#222] text-zinc-700"
                    : "bg-transparent border-slate-200 text-slate-300"
                  : type === "Short"
                  ? isDark
                    ? "bg-[#1A1A1A] text-zinc-200 border-[#333]"
                    : "bg-slate-100 text-slate-700 border-slate-300"
                  : "bg-red-950 text-[#FF3B30] border-red-900"
              }`}
            >
              {type.toUpperCase()}
            </span>
          );
        })}
      </div>

      <span
        className={`text-[10px] font-mono uppercase tracking-wider transition-colors ${
          matched ? "text-[#FF3B30] font-bold" : isDark ? "text-zinc-500" : "text-slate-400"
        }`}
      >
        {matched ? "CRITICAL ALERT: Squeeze Code Confirmed!" : "Reading pressure sensor gestures..."}
      </span>
    </div>
  );
}

/* ---------- 2. Acoustic Threat AI preview (mirrors Environmental Threat AI card) ---------- */
function AcousticThreatPreview({ isDark }: { isDark: boolean }) {
  const samples = [
    { line: "Just walking home on Main St.", risk: 15, status: "SAFE" },
    { line: "Stop following me, let go!", risk: 96, status: "EMERGENCY" },
    { line: "Someone's behind that corner...", risk: 58, status: "HIGH_THREAT" },
  ];
  const [idx, setIdx] = useState(0);
  const [db, setDb] = useState(30);

  useEffect(() => {
    const cycle = setInterval(() => setIdx((i) => (i + 1) % samples.length), 2600);
    return () => clearInterval(cycle);
  }, []);

  useEffect(() => {
    const target = samples[idx].risk > 70 ? 90 : samples[idx].risk > 40 ? 62 : 34;
    const jitter = setInterval(() => {
      setDb(target + Math.floor(Math.random() * 8 - 4));
    }, 220);
    return () => clearInterval(jitter);
  }, [idx]);

  const current = samples[idx];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Mic className={`w-4 h-4 shrink-0 ${current.risk > 70 ? "text-[#FF3B30] animate-pulse" : "text-emerald-400"}`} />
        <div className={`h-2.5 flex-1 rounded-full overflow-hidden flex gap-0.5 p-0.5 border ${isDark ? "bg-[#111] border-[#222]" : "bg-slate-200 border-slate-300"}`}>
          {Array.from({ length: 15 }).map((_, i) => {
            const activeSlots = Math.floor((db / 100) * 15);
            const active = i < activeSlots;
            const danger = i > 11;
            const warn = i > 7 && i <= 11;
            let color = isDark ? "bg-[#1A1A1A]" : "bg-slate-100";
            if (active) color = danger ? "bg-[#FF3B30]" : warn ? "bg-amber-400" : "bg-emerald-400";
            return <div key={i} className={`h-full flex-1 rounded-xs transition-colors duration-150 ${color}`} />;
          })}
        </div>
        <span className={`text-[9px] font-mono w-9 text-right ${current.risk > 70 ? "text-[#FF3B30] font-bold" : isDark ? "text-zinc-400" : "text-slate-600"}`}>{db}dB</span>
      </div>

      <div className={`rounded-xl p-3 font-mono text-[10.5px] leading-relaxed border ${isDark ? "bg-[#050505] border-[#1c1c1c]" : "bg-slate-50 border-slate-200"}`}>
        <div className="flex items-start gap-1 mb-1.5">
          <span className={isDark ? "text-zinc-600" : "text-slate-400"}>&gt; Recog:</span>
          <span className={`italic ${isDark ? "text-zinc-200" : "text-slate-800"}`}>"{current.line}"</span>
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-[9px] uppercase tracking-wider ${isDark ? "text-zinc-500" : "text-slate-400"}`}>Risk Score:</span>
          <span className={`font-bold ${current.risk >= 80 ? "text-[#FF3B30]" : current.risk >= 50 ? "text-amber-500" : "text-emerald-500"}`}>
            {current.risk}/100 &middot; {current.status.replace("_", " ")}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- 3. CrowdShield Mesh preview (mirrors CrowdShield radar tab) ---------- */
function CrowdShieldPreview({ isDark }: { isDark: boolean }) {
  const blips = [
    { bearing: 40, distance: 60, role: "Guardian" },
    { bearing: 190, distance: 85, role: "Securitas Agent" },
    { bearing: 300, distance: 45, role: "Guardian" },
  ];

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <motion.div
          className="absolute w-16 h-[1px] bg-linear-to-r from-[#FF3B30] to-transparent origin-left left-1/2"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          style={{ transformOrigin: "left center" }}
        />
        <div className={`absolute w-28 h-28 rounded-full border ${isDark ? "border-zinc-900" : "border-slate-200"}`} />
        <div className={`absolute w-20 h-20 rounded-full border ${isDark ? "border-zinc-900" : "border-slate-200"}`} />
        <div className={`absolute w-12 h-12 rounded-full border flex items-center justify-center ${isDark ? "border-zinc-800" : "border-slate-300"}`}>
          <span className="w-2 h-2 rounded-full bg-[#FF3B30] animate-pulse" />
        </div>

        {blips.map((b, i) => {
          const rad = (b.bearing * Math.PI) / 180;
          const scale = (b.distance / 100) * 58;
          const x = Math.sin(rad) * scale;
          const y = -Math.cos(rad) * scale;
          return (
            <motion.div
              key={i}
              className="absolute"
              style={{ left: `calc(50% + ${x}px - 6px)`, top: `calc(50% + ${y}px - 6px)` }}
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.3 }}
            >
              <div className={`w-3 h-3 rounded-full ${b.role === "Securitas Agent" ? "bg-amber-400" : "bg-emerald-400"} flex items-center justify-center shadow`}>
                <UserCheck className="w-1.5 h-1.5 text-zinc-950" />
              </div>
            </motion.div>
          );
        })}
      </div>
      <span className={`text-[9px] font-mono uppercase tracking-wider ${isDark ? "text-zinc-500" : "text-slate-400"}`}>
        3 Guardians within 200m &middot; Mesh Encrypted
      </span>
    </div>
  );
}

/* ---------- 4. Evidence Vault preview (mirrors Vault tab incident card) ---------- */
function EvidenceVaultPreview({ isDark }: { isDark: boolean }) {
  const [hashVisible, setHashVisible] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setHashVisible((v) => !v), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={`rounded-2xl p-4 flex flex-col gap-3 border ${isDark ? "bg-[#050505] border-[#1c1c1c]" : "bg-slate-50 border-slate-200"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <span className="text-[#FF3B30] font-bold">SOS-482913</span>
          <span className={isDark ? "text-zinc-600" : "text-slate-400"}>&middot;</span>
          <span className={isDark ? "text-zinc-500" : "text-slate-500"}>Today</span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[8.5px] font-mono font-bold uppercase bg-red-950/40 text-[#FF3B30] border border-red-900/60">
          Emergency
        </span>
      </div>

      <p className={`italic text-[10.5px] p-2.5 rounded-lg border leading-relaxed ${isDark ? "text-zinc-300 bg-[#0a0a0a] border-[#1c1c1c]" : "text-slate-700 bg-white border-slate-200"}`}>
        "Stop following me, let go!"
      </p>

      <div className={`p-2.5 rounded-lg border flex flex-col gap-1 font-mono text-[9px] uppercase tracking-wider ${isDark ? "bg-[#0a0a0a] border-[#1c1c1c]" : "bg-white border-slate-200"}`}>
        <div className="flex items-center justify-between text-emerald-400 font-bold">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3" /> Blockchain Seal Certified
          </span>
          <span>HASH OK</span>
        </div>
        <div className={`truncate font-mono text-[8px] lowercase transition-opacity duration-500 ${isDark ? "text-zinc-600" : "text-slate-400"} ${hashVisible ? "opacity-100" : "opacity-40"}`}>
          0x{hashVisible ? "8f3a1c9d2b7e4f6a1d0c9b8a7f6e5d4c3b2a1908" : "••••••••••••••••••••••••••••••••••••••"}
        </div>
      </div>
    </div>
  );
}

/* ---------- Capability data ---------- */
const CAPABILITIES: Capability[] = [
  {
    id: "squeeze",
    icon: Zap,
    title: "Discrete Squeezes",
    simulatorTag: "Wearable Core",
    description:
      "Trigger emergency status silently with personalized double or triple squeeze patterns. Activates securely from within your pocket or behind your back.",
    preview: SqueezePatternPreview,
  },
  {
    id: "acoustic",
    icon: Sparkles,
    title: "Acoustic Threat AI",
    simulatorTag: "Environmental Threat AI",
    description:
      "The companion app processes surrounding vocal metrics in real-time, instantly identifying physical grab and assault threats without revealing activity.",
    preview: AcousticThreatPreview,
  },
  {
    id: "crowdshield",
    icon: Compass,
    title: "CrowdShield Mesh",
    simulatorTag: "CrowdShield Radar",
    description:
      "Automatically build an anonymous, encrypted peer-to-peer mesh with registered local guardians, patrollers, and active civilians within 200 meters.",
    preview: CrowdShieldPreview,
  },
  {
    id: "vault",
    icon: Database,
    title: "Evidence Vault",
    simulatorTag: "Evidence Vault",
    description:
      "Collect secure high-fidelity ambient microphone logs. Each transcript and voice recording is automatically sealed with on-chain cryptographic hashes.",
    preview: EvidenceVaultPreview,
  },
];

/* ---------- One capability row (text + matching live preview) ---------- */
function CapabilityRow({
  capability,
  index,
  isDark,
  onTryDemo,
}: {
  capability: Capability;
  index: number;
  isDark: boolean;
  onTryDemo: () => void;
}) {
  const Icon = capability.icon;
  const Preview = capability.preview;
  const reversed = index % 2 === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 70 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      {/* Timeline dot (desktop only) */}
      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 -top-2 w-9 h-9 rounded-full items-center justify-center z-10">
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="w-9 h-9 rounded-full bg-[#FF3B30] text-white flex items-center justify-center font-mono text-xs font-bold shadow-lg shadow-red-600/30"
        >
          {String(index + 1).padStart(2, "0")}
        </motion.div>
      </div>

      <div className={`flex flex-col ${reversed ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-8 md:gap-14 pt-8 md:pt-0`}>
        {/* Text side */}
        <motion.div
          initial={{ opacity: 0, x: reversed ? 30 : -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 flex flex-col gap-4 text-center md:text-left items-center md:items-start"
        >
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Icon className="w-6 h-6 text-[#FF3B30]" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF3B30] font-bold">
            Capability {String(index + 1).padStart(2, "0")} &middot; {capability.simulatorTag}
          </span>
          <h4 className={`text-xl md:text-2xl font-extrabold uppercase font-mono tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
            {capability.title}
          </h4>
          <p className={`text-sm leading-relaxed max-w-md ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
            {capability.description}
          </p>
          <button
            onClick={onTryDemo}
            className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider mt-1 group ${
              isDark ? "text-zinc-300 hover:text-white" : "text-slate-600 hover:text-slate-950"
            }`}
          >
            Try it in the simulator
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Live preview side */}
        <motion.div
          initial={{ opacity: 0, x: reversed ? -30 : 30, scale: 0.96 }}
          whileInView={{ opacity: 1, x: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 w-full max-w-sm"
        >
          <SimulatorFrame isDark={isDark} label={capability.simulatorTag}>
            <Preview isDark={isDark} />
          </SimulatorFrame>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ---------- Exported section ---------- */
export default function CapabilityShowcase({ isDark, onTryDemo }: CapabilityShowcaseProps) {
  return (
    <section
      className={`py-20 md:py-28 px-6 md:px-12 border-t border-b relative overflow-hidden ${
        isDark ? "border-[#222] bg-[#09090b]/45" : "border-slate-200 bg-slate-50/50"
      }`}
    >
      <div className="max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20 md:mb-24"
        >
          <span className="text-xs font-bold text-[#FF3B30] font-mono tracking-widest uppercase">Pioneering Capabilities</span>
          <h3 className={`text-2xl md:text-3xl font-extrabold tracking-tight mt-2 ${isDark ? "text-white" : "text-slate-900"}`}>
            Designed for Extremes. Styled for Daily Wear.
          </h3>
          <p className={`text-sm mt-3 max-w-xl mx-auto ${isDark ? "text-zinc-500" : "text-slate-400"}`}>
            Scroll to walk through each capability alongside a live snapshot of the exact simulator screen it powers.
          </p>
        </motion.div>

        <div className="relative flex flex-col gap-20 md:gap-28">
          {/* Connecting timeline line (desktop only) */}
          <div
            className={`hidden md:block absolute left-1/2 -translate-x-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-transparent ${
              isDark ? "via-[#FF3B30]/25" : "via-[#FF3B30]/20"
            } to-transparent`}
          />

          {CAPABILITIES.map((cap, i) => (
            <CapabilityRow key={cap.id} capability={cap} index={i} isDark={isDark} onTryDemo={onTryDemo} />
          ))}
        </div>
      </div>
    </section>
  );
}
