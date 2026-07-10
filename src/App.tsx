import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { 
  motion, 
  AnimatePresence,
  Variants
} from "motion/react";
import { 
  Shield, 
  Radio, 
  Zap, 
  Battery, 
  Bluetooth, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Plus, 
  Trash, 
  Play, 
  Lock, 
  Database, 
  Sparkles, 
  ArrowUp, 
  ArrowDown, 
  Compass,
  Smartphone,
  RefreshCw,
  AlertOctagon,
  Mic,
  MicOff,
  UserCheck,
  Sun,
  Moon,
  ArrowLeft
} from "lucide-react";
import AnimatedTextReveal from "./components/AnimatedTextReveal";
import ScrollTextReveal from "./components/ScrollTextReveal";
import CapabilityShowcase from "./components/CapabilityShowcase";
import ClosingSection from "./components/ClosingSection";
import { 
  RingColor, 
  EmergencyContact, 
  NearbyResponder, 
  SecurityIncident, 
  RingState 
} from "./types";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 14
    }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: {
      duration: 0.15
    }
  }
};

export default function App() {
  // --- STATE SYSTEM ---
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // 1. Ring Device Simulator State
  const [ringState, setRingState] = useState<RingState>({
    connected: true,
    batteryLevel: 92,
    isCharging: false,
    selectedColor: RingColor.COSMIC_OBSIDIAN,
    firmwareVersion: "v1.0.4",
    microphoneActive: true,
    gestureThreshold: 70,
    calibrationPattern: ["Short", "Short", "Short", "Long"],
    currentSqueezeInput: [],
    lastHapticFeedback: "Connected. Default pattern set."
  });

  // User Gesture Squeeze Pattern Queue Timer
  const [gestureTimeout, setGestureTimeout] = useState<NodeJS.Timeout | null>(null);

  // 2. Emergency Contacts List (Up to 5)
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    { id: "c1", name: "Sarah Jenkins", phone: "+1 (555) 321-7890", relationship: "Sister / Primary Guardian", priority: 1, isAuthority: false, lastCheckIn: "4 mins ago", safetyStatus: "safe" },
    { id: "c2", name: "David Miller", phone: "+1 (555) 890-1234", relationship: "Partner", priority: 2, isAuthority: false, lastCheckIn: "27 mins ago", safetyStatus: "safe" },
    { id: "c3", name: "Metro City Emergency Response Services", phone: "911 Dispatch Liaison", relationship: "Local Authority", priority: 3, isAuthority: true, lastCheckIn: "Continuous (E-911)", safetyStatus: "safe" }
  ]);

  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactRelationship, setNewContactRelationship] = useState("");
  const [newContactIsAuthority, setNewContactIsAuthority] = useState(false);

  // 3. Simulated Nearby Responders (CrowdShield Mode)
  const [responders, setResponders] = useState<NearbyResponder[]>([
    { id: "r1", name: "Guardian Angel #092", distanceM: 45, bearingDeg: 34, role: "Guardian Angel", isMovingTowardsMe: false },
    { id: "r2", name: "Patrol Officer Mitchell", distanceM: 110, bearingDeg: 280, role: "Securitas Agent", isMovingTowardsMe: false },
    { id: "r3", name: "CrowdShield User #410", distanceM: 175, bearingDeg: 145, role: "Responder", isMovingTowardsMe: false }
  ]);
  const [crowdShieldEnabled, setCrowdShieldEnabled] = useState<boolean>(true);

  // 4. Evidence Vault Incidents List
  const [incidents, setIncidents] = useState<SecurityIncident[]>([
    {
      id: "INC-8839",
      timestamp: "2026-07-08T22:15:00Z",
      durationSec: 15,
      transcript: "Stop following me! I said stay back! Don't touch me!",
      riskScore: 88,
      status: "EMERGENCY",
      threatType: "Physical Grab / Pursuit",
      locationTrail: [
        { lat: 37.7749, lng: -122.4194, time: "22:14:45" },
        { lat: 37.7752, lng: -122.4192, time: "22:15:00" }
      ],
      blockHash: "0x8fa37d2e99c15abde77209e9f123bc8d774fbe6130982aecc2939d8e124fa60b",
      isBlockchainCertified: true,
      aiDetailedAssessment: "CRITICAL ALERT: Dynamic vocal analysis confirms female subject in high-stress state. Boundary violation and physically defensive phrasing identified.",
      safetyInstructions: ["Head towards the well-lit gas station on corner.", "Scream loudly for attention.", "Dispatched SOS directly to 3 contacts."]
    },
    {
      id: "INC-5102",
      timestamp: "2026-07-06T19:40:00Z",
      durationSec: 10,
      transcript: "I'm feeling unsafe, there's a suspicious car trailing behind me on Elm St.",
      riskScore: 42,
      status: "LOW_THREAT",
      threatType: "Vehicle Stalking",
      locationTrail: [
        { lat: 37.7812, lng: -122.4223, time: "19:39:50" },
        { lat: 37.7809, lng: -122.4225, time: "19:40:00" }
      ],
      blockHash: "0x3e18a9010bcdef54a8e239401cd998b25123fc7e6829bc12de88a91c28f9d0c8",
      isBlockchainCertified: true,
      aiDetailedAssessment: "ELEVATED ALERT: Suspicious stalking pattern noted. Low-decibel whisper suggests hiding state.",
      safetyInstructions: ["Walking speed tracking enabled.", "Haptic feedback pattern ready.", "Awaiting primary double-squeeze gesture."]
    }
  ]);

  // 5. Active Emergency SOS Flow State
  const [sosActive, setSosActive] = useState<boolean>(false);
  const [sosCountdown, setSosCountdown] = useState<number>(10);
  const [activeSOSId, setActiveSOSId] = useState<string | null>(null);
  const [sosTriggerMethod, setSosTriggerMethod] = useState<string>("Hardware Squeeze Pattern");
  const [sosDispatched, setSosDispatched] = useState<boolean>(false);
  const [sosLocation, setSosLocation] = useState<{ lat: number; lng: number }>({ lat: 37.7749, lng: -122.4194 });
  const [sosTrail, setSosTrail] = useState<{ lat: number; lng: number; time: string }[]>([]);
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");

  // 6. Voice Recognition / Aggression AI Simulator State
  const [micListening, setMicListening] = useState<boolean>(false);
  const [speechTranscript, setSpeechTranscript] = useState<string>("");
  const [soundDbLevel, setSoundDbLevel] = useState<number>(30);
  const [isDbAnimating, setIsDbAnimating] = useState<boolean>(false);
  const [aiAnalysisRunning, setAiAnalysisRunning] = useState<boolean>(false);
  const [aiFeedback, setAiFeedback] = useState<any>(null);

  // 7. Dynamic UI States
  const [currentPage, setCurrentPage] = useState<"landing" | "simulator">("landing");
  const [currentTime, setCurrentTime] = useState<string>("14:52");
  const [ringRotation, setRingRotation] = useState<number>(0);
  const [customVocalSpeech, setCustomVocalSpeech] = useState<string>("");
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(false);
  const [activeVoiceTriggerState, setActiveVoiceTriggerState] = useState<string>("Idle");

  // 8. Ring Diagnostics Tab States
  const [ringSimTab, setRingSimTab] = useState<"control" | "diagnostics">("control");
  const [selectedHapticPattern, setSelectedHapticPattern] = useState<"pulse" | "staccato" | "long-hold">("pulse");
  const [hapticDuration, setHapticDuration] = useState<number>(1.5); // duration in seconds
  const [isVibrating, setIsVibrating] = useState<boolean>(false);
  const [vibrationTimer, setVibrationTimer] = useState<NodeJS.Timeout | null>(null);

  const d3SvgRef = useRef<SVGSVGElement | null>(null);
  const locationWatchRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const dbAnimationRef = useRef<number | null>(null);

  // D3 Real-time Haptic Waveform Rendering Effect
  useEffect(() => {
    const svgElement = d3SvgRef.current;
    if (!svgElement) return;

    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();

    const rect = svgElement.getBoundingClientRect();
    const width = rect.width || svgElement.clientWidth || 320;
    const height = rect.height || svgElement.clientHeight || 80;

    // Set viewbox for responsiveness
    svg.attr("viewBox", `0 0 ${width} ${height}`)
       .attr("preserveAspectRatio", "none");

    // Add glowing filter for professional oscilloscope effect
    const defs = svg.append("defs");
    const filter = defs.append("filter")
      .attr("id", "haptic-glow")
      .attr("x", "-20%")
      .attr("y", "-20%")
      .attr("width", "140%")
      .attr("height", "140%");
    
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "1.5")
      .attr("result", "blur");
    
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "blur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Horizontal reference grid lines
    const gridGroup = svg.append("g").attr("class", "grid-lines");
    [0.25, 0.5, 0.75].forEach(ratio => {
      gridGroup.append("line")
        .attr("x1", 0)
        .attr("y1", height * ratio)
        .attr("x2", width)
        .attr("y2", height * ratio)
        .attr("stroke", theme === "dark" ? "#222" : "#cbd5e1")
        .attr("stroke-width", "1")
        .attr("stroke-dasharray", "3,3")
        .attr("opacity", "0.6");
    });

    const numPoints = 100;
    const xScale = d3.scaleLinear().domain([0, numPoints - 1]).range([0, width]);
    const yScale = d3.scaleLinear().domain([-1.2, 1.2]).range([height - 6, 6]);

    // Render the signal wave path
    const path = svg.append("path")
      .attr("fill", "none")
      .attr("stroke", "#FF3B30")
      .attr("stroke-width", "2")
      .style("filter", "url(#haptic-glow)");

    let animationId: number;
    const startTime = performance.now();

    const drawFrame = () => {
      const elapsed = performance.now() - startTime;
      const data: number[] = [];

      for (let i = 0; i < numPoints; i++) {
        let amp = 0;
        if (isVibrating) {
          if (selectedHapticPattern === "pulse") {
            // Heartbeat double pulse propagating along index
            const cycle = (elapsed - i * 15) % 1100;
            if (cycle < 200) {
              amp = Math.sin(cycle * Math.PI / 200) * 0.85;
            } else if (cycle >= 250 && cycle < 420) {
              amp = Math.sin((cycle - 250) * Math.PI / 170) * 0.5;
            } else {
              amp = 0;
            }
            // Add tiny high-frequency vibration texture
            amp += (Math.random() - 0.5) * 0.05;
          } else if (selectedHapticPattern === "staccato") {
            // Rapid periodic spikes with fast decay
            const cycle = (elapsed - i * 10) % 350;
            if (cycle < 90) {
              amp = Math.sin(cycle * Math.PI / 90) * 0.95;
              amp *= (1 - cycle / 90); // decay linear envelope
            } else {
              amp = 0;
            }
            amp += (Math.random() - 0.5) * 0.08;
          } else if (selectedHapticPattern === "long-hold") {
            // Continuous heavy hum
            amp = Math.sin((elapsed - i * 6) * 0.06) * 0.55 + Math.sin((elapsed - i * 4) * 0.14) * 0.25;
            amp += (Math.random() - 0.5) * 0.07;
          }
        } else {
          // Low standby noise
          amp = (Math.random() - 0.5) * 0.012 + Math.sin((elapsed - i * 12) * 0.005) * 0.01;
        }
        data.push(amp);
      }

      const lineGenerator = d3.line<number>()
        .x((_, idx) => xScale(idx))
        .y(d => yScale(d))
        .curve(d3.curveMonotoneX);

      path.attr("d", lineGenerator(data) || "");

      animationId = requestAnimationFrame(drawFrame);
    };

    drawFrame();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isVibrating, selectedHapticPattern, theme, ringSimTab]);

  const triggerHapticDiagnostic = (pattern: "pulse" | "staccato" | "long-hold", durationSec: number) => {
    if (vibrationTimer) {
      clearTimeout(vibrationTimer);
    }
    
    setIsVibrating(true);
    
    const patternLabels = {
      pulse: "Heartbeat Pulse Pattern",
      staccato: "Staccato Alert Warn Pattern",
      "long-hold": "Continuous Long Hold Pattern"
    };
    
    setRingState(r => ({
      ...r,
      lastHapticFeedback: `📳 Executing diagnostic haptic: ${patternLabels[pattern]} (${durationSec}s)`
    }));

    const timer = setTimeout(() => {
      setIsVibrating(false);
      setRingState(r => ({
        ...r,
        lastHapticFeedback: `✅ Diagnostic complete: ${patternLabels[pattern]} finished.`
      }));
    }, durationSec * 1000);
    
    setVibrationTimer(timer);
  };

  // Web Speech Recognition Reference
  const recognitionRef = useRef<any>(null);

  const requestCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      console.warn("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const nowStr = new Date().toLocaleTimeString();

        setSosLocation({ lat, lng });
        setSosTrail([{ lat, lng, time: nowStr }]);
        console.log("Live location acquired:", lat, lng);
      },
      (error) => {
        console.warn("Location permission denied or unavailable:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );
  };

  const startRealDecibelMeter = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      console.warn("Microphone audio stream is not supported by this browser.");
      return;
    }

    if (audioContextRef.current || analyserRef.current || micStreamRef.current) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateDb = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteTimeDomainData(dataArray);

        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const normalized = (dataArray[i] - 128) / 128;
          sumSquares += normalized * normalized;
        }

        const rms = Math.sqrt(sumSquares / dataArray.length);
        const approxDb = Math.min(100, Math.max(30, Math.round(30 + rms * 120)));
        setSoundDbLevel(approxDb);

        dbAnimationRef.current = requestAnimationFrame(updateDb);
      };

      updateDb();
    } catch (err) {
      console.warn("Could not start real decibel meter:", err);
    }
  };

  const stopRealDecibelMeter = () => {
    if (dbAnimationRef.current !== null) {
      cancelAnimationFrame(dbAnimationRef.current);
      dbAnimationRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setSoundDbLevel(30);
  };

  const enterLiveSimulator = () => {
    setCurrentPage("simulator");
    setIsOnboarded(true);
    window.scrollTo({ top: 0, behavior: "smooth" });

    requestCurrentLocation();

    setTimeout(() => {
      try {
        if (recognitionRef.current && !micListening) {
          recognitionRef.current.start();
          startRealDecibelMeter();
        }
      } catch (err) {
        console.warn("Could not auto-start microphone:", err);
      }
    }, 500);
  };

  const scrollToDemo = () => {
    const element = document.getElementById("try-demo-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Tick clock to mimic actual high-end UI
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");
      setCurrentTime(`${hours}:${mins}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Track real browser GPS while SOS is active. CrowdShield responders remain simulated until real responder networking exists.
  useEffect(() => {
    let responderInterval: any;

    if (sosActive) {
      if ("geolocation" in navigator) {
        locationWatchRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const nowStr = new Date().toLocaleTimeString();

            setSosLocation({ lat, lng });
            setSosTrail(trail => [...trail, { lat, lng, time: nowStr }]);
          },
          (error) => {
            console.warn("Live SOS GPS tracking failed:", error);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 3000,
            timeout: 10000
          }
        );
      } else {
        console.warn("Geolocation is not supported by this browser.");
      }

      // Pull nearby responders closer during SOS to show simulated help arriving.
      // This part is still simulated; real CrowdShield requires accounts, GPS sharing, and a database/realtime service.
      responderInterval = setInterval(() => {
        setResponders(prev => {
          return prev.map(r => {
            if (r.distanceM > 5) {
              const approachDistance = Math.floor(Math.random() * 8) + 4;
              return {
                ...r,
                distanceM: Math.max(r.distanceM - approachDistance, 3),
                isMovingTowardsMe: true
              };
            }
            return r;
          });
        });
      }, 3000);
    }

    return () => {
      if (locationWatchRef.current !== null) {
        navigator.geolocation.clearWatch(locationWatchRef.current);
        locationWatchRef.current = null;
      }
      clearInterval(responderInterval);
    };
  }, [sosActive]);

  // Countdown timer for automatic emergency authorities dispatch
  useEffect(() => {
    let timer: any;
    if (sosActive && !sosDispatched) {
      if (sosCountdown > 0) {
        timer = setTimeout(() => {
          setSosCountdown(prev => prev - 1);
        }, 1000);
      } else {
        triggerSOSDispatch();
      }
    }
    return () => clearTimeout(timer);
  }, [sosActive, sosCountdown, sosDispatched]);

  // Initialize Web Speech API for authentic voice analysis
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (event: any) => {
        const currentResultIndex = event.resultIndex;
        const transcriptText = event.results[currentResultIndex][0].transcript;
        setSpeechTranscript(transcriptText);
        if (!analyserRef.current) setSoundDbLevel(Math.floor(Math.random() * 30) + 65); // fallback visual if Web Audio is unavailable

        // Trigger AI analysis on finished statements
        if (event.results[currentResultIndex].isFinal) {
          analyzeSituationalSpeech(transcriptText);
        }
      };

      rec.onstart = () => {
        setMicListening(true);
        setActiveVoiceTriggerState("Listening...");
        // Animate decibel bar
        setIsDbAnimating(true);
        startRealDecibelMeter();
      };

      rec.onend = () => {
        setMicListening(false);
        setActiveVoiceTriggerState("Inactive");
        setIsDbAnimating(false);
        stopRealDecibelMeter();
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Squeeze gesture queue processor
  const addSqueezeInput = (type: "Short" | "Long") => {
    // Clear any pending queue resets
    if (gestureTimeout) {
      clearTimeout(gestureTimeout);
    }

    setRingState(prev => {
      const updatedInput = [...prev.currentSqueezeInput, type];
      
      // Trigger subtle tactile haptic vibration feedback log
      let feedback = `Tactile Squeeze: ${type} Press`;
      
      // Compare if it matches the calibrated SOS pattern
      const isMatch = checkPatternMatch(updatedInput, prev.calibrationPattern);
      
      if (isMatch) {
        feedback = "CRITICAL ALERT: Custom Squeeze SOS Code Confirmed!";
        // Trigger alert
        setTimeout(() => {
          activateSOSFlow("Hardware Custom Ring Squeeze");
        }, 100);
      } else if (updatedInput.length >= prev.calibrationPattern.length) {
        feedback = "Tactile alert: Pattern did not match SOS code. Squeeze queue reset.";
        // Reset soon
        setTimeout(() => {
          setRingState(r => ({ ...r, currentSqueezeInput: [] }));
        }, 800);
      }

      return {
        ...prev,
        currentSqueezeInput: updatedInput,
        lastHapticFeedback: feedback
      };
    });

    // Reset input queue if user hesitates longer than 3 seconds
    const timeout = setTimeout(() => {
      setRingState(prev => ({
        ...prev,
        currentSqueezeInput: [],
        lastHapticFeedback: "Tactile idle. Gestures reset due to timeout."
      }));
    }, 3000);
    setGestureTimeout(timeout);
  };

  const checkPatternMatch = (input: string[], calibrated: string[]): boolean => {
    if (input.length !== calibrated.length) return false;
    for (let i = 0; i < input.length; i++) {
      if (input[i] !== calibrated[i]) return false;
    }
    return true;
  };

  // Turn real browser microphone listening on/off
  const toggleRealMicrophone = () => {
    if (!isSpeechSupported) {
      alert("Speech recognition is not fully supported in this browser. Please use the simulated high-decibel alert presets instead!");
      return;
    }

    if (micListening) {
      recognitionRef.current?.stop();
      stopRealDecibelMeter();
    } else {
      try {
        recognitionRef.current?.start();
        startRealDecibelMeter();
      } catch (err) {
        console.error("Microphone startup error:", err);
      }
    }
  };

  // SOS activation logic
  const activateSOSFlow = (method: string) => {
    if (sosActive) return;
    
    // Squeeze Ring Haptic Blast - continuous rapid pulses
    setRingState(prev => ({
      ...prev,
      lastHapticFeedback: "Vibrating Alert: Fast Double-Squeeze confirming SOS Dispatch Initiated!"
    }));

    const locationId = "SOS-" + Math.floor(100000 + Math.random() * 900000);
    requestCurrentLocation();
    const initialLat = sosLocation.lat;
    const initialLng = sosLocation.lng;
    
    setSosLocation({ lat: initialLat, lng: initialLng });
    setSosTrail([{ lat: initialLat, lng: initialLng, time: new Date().toLocaleTimeString() }]);
    setSosActive(true);
    setSosCountdown(10);
    setSosDispatched(false);
    setActiveSOSId(locationId);
    setSosTriggerMethod(method);
    setActiveTab("alert");
  };

  // Actual backend SOS alert dispatcher
  const triggerSOSDispatch = async () => {
    setSosDispatched(true);
    try {
      const response = await fetch("/api/trigger-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contacts: contacts.filter(c => c.priority <= 3),
          location: sosLocation,
          triggerMethod: sosTriggerMethod,
          timestamp: new Date().toISOString()
        })
      });

      const result = await response.json();
      if (result.success) {
        // Broadcast completed, now log the incident in Vault
        const newIncident: SecurityIncident = {
          id: result.sosID,
          timestamp: result.dispatchedAt,
          durationSec: 15,
          transcript: speechTranscript || "Manual device panic squeeze triggered.",
          riskScore: 95,
          status: "EMERGENCY",
          threatType: "User SOS Alert Dispatched",
          locationTrail: sosTrail,
          blockHash: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
          isBlockchainCertified: true,
          aiDetailedAssessment: "CRITICAL: Secure satellite backup dispatched. Emergency authorities mobilized. Contact alert logs show successful SMS delivery."
        };

        setIncidents(prev => [newIncident, ...prev]);
        setRingState(prev => ({
          ...prev,
          lastHapticFeedback: "Tactile Alert: Authority Dispatch CONFIRMED (Vibe: 3 long pulses)"
        }));
      }
    } catch (err) {
      console.error("Failed to notify server of SOS alert:", err);
    }
  };

  // De-escalation & SOS cancel logic
  const cancelSOSAlert = () => {
    if (pinInput === "1234" || pinInput === "0000" || pinInput === "") {
      setSosActive(false);
      setSosDispatched(false);
      setPinInput("");
      setPinError("");
      setActiveTab("dashboard");
      setRingState(prev => ({
        ...prev,
        lastHapticFeedback: "Alert Canceled. Returned to normal secure mode."
      }));
    } else {
      setPinError("Invalid deactivation PIN. Authorities still inbound.");
      setRingState(prev => ({
        ...prev,
        lastHapticFeedback: "Alert: False PIN entered. Dispatch locked!"
      }));
    }
  };

  // Environmental Threat Speech Analyzer
  const analyzeSituationalSpeech = async (transcriptText: string, simulateHighDb = false) => {
    if (!transcriptText.trim()) return;
    setAiAnalysisRunning(true);
    setActiveVoiceTriggerState("Evaluating voice threat level...");

    try {
      const response = await fetch("/api/analyze-threat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcriptText,
          audioSnippetLengthSec: 6,
          simulatedAudio: simulateHighDb
        })
      });

      const resData = await response.json();
      if (resData.success) {
        const assessment = resData.data;
        setAiFeedback(assessment);

        // If risk level is emergency and high confidence, trigger SOS immediately
        if (assessment.autoTriggerSOS) {
          activateSOSFlow(`Aggressive Speech AI auto-activation: "${transcriptText}"`);
        } else {
          setActiveVoiceTriggerState(`Finished: ${assessment.status} (Score ${assessment.riskScore})`);
        }
      }
    } catch (err) {
      console.error("Situational analysis error:", err);
      setActiveVoiceTriggerState("AI analysis failed.");
    } finally {
      setAiAnalysisRunning(false);
    }
  };

  // Simulated preset voice distress activation
  const simulateDistressPreset = (phrase: string, highDb = true) => {
    setSpeechTranscript(phrase);
    if (highDb) {
      setSoundDbLevel(94); // High distress level decibels
    } else {
      setSoundDbLevel(52); // Low normal decibels
    }
    analyzeSituationalSpeech(phrase, highDb);
  };

  // Emergency contact list handlers
  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName || !newContactPhone) return;

    const newContact: EmergencyContact = {
      id: "c-" + Date.now(),
      name: newContactName,
      phone: newContactPhone,
      relationship: newContactRelationship || "Contact",
      priority: contacts.length + 1,
      isAuthority: newContactIsAuthority,
      lastCheckIn: "Just added",
      safetyStatus: "unchecked"
    };

    setContacts([...contacts, newContact]);
    setNewContactName("");
    setNewContactPhone("");
    setNewContactRelationship("");
    setNewContactIsAuthority(false);
  };

  const handlePingContact = (id: string) => {
    // 1. Set status to checking
    setContacts(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          lastCheckIn: "Pinging device...",
          safetyStatus: "unchecked"
        };
      }
      return c;
    }));

    // Trigger ring haptic feedback
    setRingState(prev => ({
      ...prev,
      lastHapticFeedback: "Haptic Pulse: Sent secure check-in ping to Guardian device!"
    }));

    // 2. Resolve to "safe" after 1.2 seconds
    setTimeout(() => {
      setContacts(prev => prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            lastCheckIn: "Just now",
            safetyStatus: "safe"
          };
        }
        return c;
      }));
      setRingState(prev => ({
        ...prev,
        lastHapticFeedback: "Check-In Handshake: Secure 'Safe' confirmation received!"
      }));
    }, 1200);
  };

  const handleRemoveContact = (id: string) => {
    const updated = contacts.filter(c => c.id !== id).map((c, index) => ({
      ...c,
      priority: index + 1
    }));
    setContacts(updated);
  };

  const shiftPriority = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === contacts.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const listCopy = [...contacts];
    
    // Swap
    const temp = listCopy[index];
    listCopy[index] = listCopy[targetIndex];
    listCopy[targetIndex] = temp;

    // Recalculate Priority order numbers
    const final = listCopy.map((c, i) => ({ ...c, priority: i + 1 }));
    setContacts(final);
  };

  // Run detailed report through Gemini or high-fidelity engine inside vault
  const analyzeEvidenceWithGemini = async (incident: SecurityIncident) => {
    setAiAnalysisRunning(true);
    try {
      const response = await fetch("/api/analyze-threat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: incident.transcript,
          audioSnippetLengthSec: incident.durationSec,
          simulatedAudio: true
        })
      });

      const resData = await response.json();
      if (resData.success) {
        setIncidents(prev => prev.map(inc => {
          if (inc.id === incident.id) {
            return {
              ...inc,
              aiDetailedAssessment: `SECURE GUARDIAN REPORT [AI Processed: ${resData.aiProcessed ? "Yes" : "Local Verified"}] : ${resData.data.briefAssessment}`,
              safetyInstructions: resData.data.safetyInstructions
            };
          }
          return inc;
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiAnalysisRunning(false);
    }
  };

  const isDark = theme === "dark";

  // Dynamic style tokens for Tactical Dark and High-Visibility Light mode
  const styles = {
    bgApp: isDark ? "bg-[#050505] text-[#F5F5F5]" : "bg-[#f8fafc] text-slate-900",
    headerBg: isDark ? "border-[#222]/80 bg-[#050505]/90 text-white" : "border-slate-200 bg-white/90 text-slate-900",
    textTitle: isDark ? "text-[#F5F5F5]" : "text-slate-900",
    textDesc: isDark ? "text-zinc-400" : "text-slate-500",
    badgeBg: isDark ? "bg-[#1A1A1A] border-[#333] text-zinc-300" : "bg-slate-100 border-slate-200 text-slate-600",
    cardBg: isDark ? "bg-[#111] border-[#222] text-[#F5F5F5]" : "bg-white border-slate-200/80 text-slate-800 shadow-md shadow-slate-100/30",
    innerBg: isDark ? "bg-[#050505] border-[#222]" : "bg-slate-50 border-slate-200 shadow-inner",
    textMain: isDark ? "text-zinc-300" : "text-slate-700",
    textSec: isDark ? "text-zinc-400" : "text-slate-500",
    textMuted: isDark ? "text-zinc-500" : "text-slate-400",
    textStrong: isDark ? "text-white" : "text-slate-900",
    border: isDark ? "border-[#222]" : "border-slate-200",
    borderB: isDark ? "border-[#222]/80" : "border-slate-200",
    borderT: isDark ? "border-t border-[#222]" : "border-t border-slate-200",
    selectBg: isDark ? "bg-[#111] border-[#222] text-[#F5F5F5]" : "bg-white border-slate-200 text-slate-800",
    inputBg: isDark ? "bg-[#111] border-[#222]" : "bg-white border-slate-200 text-slate-800",
    buttonSec: isDark ? "bg-[#1A1A1A] border-[#333] text-zinc-300 hover:bg-[#222]" : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200",
    footerBg: isDark ? "border-[#222] bg-[#050505] text-zinc-500" : "border-slate-200 bg-white text-slate-500",
    divider: isDark ? "border-[#222]" : "border-slate-100",
  };

  return (
    <div 
      id="app-container" 
      className={`min-h-screen ${styles.bgApp} flex flex-col font-sans transition-colors duration-200 selection:bg-[#FF3B30]/30 selection:text-white ${isHighContrast ? "accessibility-mode" : ""}`}
    >
      {/* HEADER BAR */}
      <header id="main-header" className={`border-b ${styles.borderB} ${isDark ? "bg-[#050505]/90" : "bg-white/90"} backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50 transition-colors duration-200`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#FF3B30] flex items-center justify-center shrink-0">
            <div className="w-2 h-2 bg-[#FF3B30] rounded-full animate-pulse"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-xl font-bold tracking-tight ${styles.textTitle}`}>GUARDIAN<span className="text-[#FF3B30]">HALO</span></h1>
              <span className="text-[9px] bg-red-950/80 text-[#FF3B30] border border-red-900 px-1.5 py-0.5 rounded-sm font-mono uppercase font-bold">IoT Companion</span>
            </div>
            <p className={`text-[10.5px] ${styles.textDesc}`}>Silent Wearable Security &amp; Emergency Ecosystem</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Quick Stats Banner */}
          <div className="hidden lg:flex items-center gap-3">
            <div className={`${styles.badgeBg} px-4 py-1.5 rounded-full border flex items-center gap-2 text-xs font-mono`}>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              RING CONNECTED
            </div>
            <div className={`${styles.badgeBg} px-4 py-1.5 rounded-full border flex items-center gap-2 text-xs font-mono`}>
              <Battery className="w-3.5 h-3.5 text-green-500" />
              {ringState.batteryLevel}% BATTERY
            </div>
          </div>

          {/* Try Demo Shortcut Button */}
          {currentPage === "landing" ? (
            <button
              id="btn-nav-try-demo"
              onClick={enterLiveSimulator}
              className="px-4 py-1.5 bg-[#FF3B30] text-white hover:bg-red-600 rounded-full text-xs font-bold font-mono flex items-center gap-1.5 transition-all shadow-md active:scale-95 hover:scale-[1.02]"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>TRY SIMULATOR</span>
            </button>
          ) : (
            <button
              id="btn-nav-back-home"
              onClick={() => {
                setCurrentPage("landing");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`px-4 py-1.5 rounded-full border text-xs font-bold font-mono flex items-center gap-1.5 transition-all active:scale-95 hover:scale-[1.02] ${
                isDark 
                  ? "bg-[#1A1A1A] text-zinc-300 border-[#333] hover:border-[#FF3B30]" 
                  : "bg-white text-slate-800 border-slate-300 shadow-sm hover:border-slate-400"
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>BACK TO HOME</span>
            </button>
          )}

          {/* Global Theme Toggle */}
          <button
            id="btn-theme-toggle"
            onClick={() => setTheme(prev => prev === "dark" ? "light" : "dark")}
            className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold font-mono flex items-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-95 ${
              isDark 
                ? "bg-[#1A1A1A] text-zinc-300 border-[#333] hover:border-[#FF3B30]" 
                : "bg-white text-slate-800 border-slate-300 shadow-sm hover:border-slate-400"
            }`}
            title="Toggle Global Theme"
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>HIGH-VISIBILITY LIGHT</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                <span>TACTICAL DARK</span>
              </>
            )}
          </button>

          {/* High contrast switch */}
          <button
            id="btn-contrast-toggle"
            onClick={() => setIsHighContrast(!isHighContrast)}
            className={`px-3.5 py-1.5 rounded-full border text-xs font-medium font-mono transition-all duration-200 ${
              isHighContrast 
                ? "bg-white text-zinc-950 border-white" 
                : "bg-[#1A1A1A] text-zinc-300 border-[#333] hover:border-[#FF3B30]"
            }`}
          >
            {isHighContrast ? "DEFAULT VIEW" : "HIGH CONTRAST"}
          </button>
        </div>
      </header>

      {/* WEBSITE MARKETING LANDING PAGE & SIMULATOR INTEGRATION */}
      <main id="main-content" className="flex-1 w-full flex flex-col">
        <AnimatePresence mode="wait">
          {currentPage === "landing" ? (
            <motion.div
              key="landing-page"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col w-full"
            >
              {/* HERO SECTION */}
              <section className="relative overflow-hidden pt-16 pb-20 px-6 md:px-12 text-center max-w-5xl mx-auto flex flex-col items-center">

          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl leading-tight">
            <AnimatedTextReveal text="Silent Protection. Real-Time Security. On Your Finger." variant="onboarding" />
          </h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className={`text-base md:text-lg max-w-3xl leading-relaxed mb-8 ${styles.textDesc}`}
          >
            GuardianHalo is a state-of-the-art titanium smart ring designed to bypass the critical friction of phone-unlocking in panic states. Pair with our dynamic AI companion suite to access silent squeeze gestures, ambient neural danger detection, decentralized rescue mesh, and tamper-certified evidence.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 animate-fade-in"
          >
            <button
              onClick={enterLiveSimulator}
              className="px-8 py-4 bg-[#FF3B30] text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-red-600/35 hover:bg-[#D32F2F] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              TRY INTERACTIVE DEMO
            </button>
            <button
              onClick={() => alert("🏆 GuardianHalo Hackathon Pitch:\n\nDesigned as a premium safety wearable, GuardianHalo targets the immediate gap in reactive security. By moving the trigger to an on-ring physical pressure sensor, we compress emergency contact routing time to <1.2s while certifying vital micro-audio recordings directly to an Evidence Vault via immutable hash signatures. Try the interactive hardware loop inside our simulator!")}
              className={`px-8 py-4 rounded-xl border text-sm font-bold tracking-wide active:scale-95 transition-all ${styles.buttonSec}`}
            >
              READ PRODUCT SPEC
            </button>
          </motion.div>
        </section>

        {/* CORE PRODUCT FEATURES SECTION - reveals one capability at a time on scroll,
            each paired with a live preview matching the simulator section it powers */}
        <CapabilityShowcase
          isDark={isDark}
          onTryDemo={enterLiveSimulator}
        />

        {/* Scroll-linked dynamic text-reveal component */}
        <div className="max-w-7xl mx-auto w-full p-4 lg:p-8">
          <ScrollTextReveal 
            text="Craft experiences people remember. Every scroll tells part of the story." 
            isDark={isDark}
          />
        </div>

        {/* CLOSING SECTION - proper end-of-page moment + footer (previously the
            page just stopped after the block above) */}
        <ClosingSection
          isDark={isDark}
          onTryDemo={enterLiveSimulator}
        />
      </motion.div>
    ) : (
      <motion.div
        key="simulator-page"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        className="flex flex-col w-full"
      >
        {/* INTERACTIVE WORKSPACE SIMULATOR */}
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 p-4 lg:p-8">
        
        {/* ========================================================
            LEFT COLUMN: INTERACTIVE HARDWARE IoT RING SIMULATOR 
            ======================================================== */}
        <section id="ring-simulator-column" className="lg:col-span-5 flex flex-col gap-6">
          <motion.div 
            id="ring-simulator-card" 
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className={`rounded-[32px] p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden transition-all duration-300 ${styles.cardBg}`}
          >
            
            {/* Visual background gradient decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full filter blur-xl"></div>
            
            {/* Simulator title */}
            <div className={`flex items-center justify-between border-b pb-3 ${styles.divider}`}>
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg transition-colors ${styles.buttonSec}`}>
                  <Database className="w-4 h-4" />
                </span>
                <h2 className={`text-sm font-semibold tracking-tight uppercase font-mono ${styles.textStrong}`}>Hardware SmartRing Simulator</h2>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full transition-colors ${styles.badgeBg}`}>BLE 5.0 Core</span>
              </div>
            </div>

            {/* Tab Selector */}
            <div className={`grid grid-cols-2 p-1 rounded-xl ${isDark ? "bg-[#111]" : "bg-slate-100"}`}>
              <button
                id="btn-ring-tab-controls"
                onClick={() => setRingSimTab("control")}
                className={`py-2 text-[10px] font-mono font-bold rounded-lg transition-all ${
                  ringSimTab === "control"
                    ? "bg-[#FF3B30] text-white shadow-sm"
                    : isDark 
                    ? "text-zinc-400 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🎮 WEARABLE CORE
              </button>
              <button
                id="btn-ring-tab-diagnostics"
                onClick={() => setRingSimTab("diagnostics")}
                className={`py-2 text-[10px] font-mono font-bold rounded-lg transition-all ${
                  ringSimTab === "diagnostics"
                    ? "bg-[#FF3B30] text-white shadow-sm"
                    : isDark 
                    ? "text-zinc-400 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ⚡ HAPTIC DIAGS
              </button>
            </div>

            {/* Simulated Ring Options - styled bento-style */}
            {ringSimTab === "control" && (
              <div className={`rounded-[24px] p-5 grid grid-cols-2 gap-4 text-xs transition-all duration-300 hover:scale-[1.02] ${styles.innerBg} hover:border-[#FF3B30]/30`}>
                <div>
                  <label className={`block mb-1.5 font-mono text-[10px] uppercase ${styles.textSec}`}>Wearable Shade</label>
                  <select 
                    id="select-ring-color"
                    value={ringState.selectedColor}
                    onChange={(e) => setRingState(r => ({ ...r, selectedColor: e.target.value as RingColor }))}
                    className={`w-full rounded-xl p-2.5 font-mono focus:border-[#FF3B30] focus:outline-none transition-colors ${styles.selectBg}`}
                  >
                    <option value={RingColor.COSMIC_OBSIDIAN}>Cosmic Obsidian (Matte)</option>
                    <option value={RingColor.AURELIA_GOLD}>Aurelia Gold (Polished)</option>
                    <option value={RingColor.PLATINUM_SILVER}>Platinum Silver (Sleek)</option>
                  </select>
                </div>

                <div>
                  <label className={`block mb-1.5 font-mono text-[10px] uppercase ${styles.textSec}`}>Battery Charging Simulation</label>
                  <div className="flex gap-2">
                    <button
                      id="btn-charge-sim"
                      onClick={() => {
                        setRingState(r => {
                          const nextCharging = !r.isCharging;
                          return {
                             ...r,
                             isCharging: nextCharging,
                             batteryLevel: nextCharging ? Math.min(r.batteryLevel + 3, 100) : r.batteryLevel
                          };
                        });
                      }}
                      className={`flex-1 p-2.5 rounded-xl border text-xs font-mono text-center font-medium transition-colors duration-200 ${
                        ringState.isCharging 
                          ? "bg-green-950/40 text-green-400 border-green-800" 
                          : isDark
                          ? "bg-[#111] text-zinc-300 border-[#222] hover:border-[#FF3B30]"
                          : "bg-white text-slate-700 border-slate-200 hover:border-[#FF3B30] hover:bg-slate-50"
                      }`}
                    >
                      {ringState.isCharging ? "Charging..." : "Plug In"}
                    </button>
                    <button
                      id="btn-drain-sim"
                      onClick={() => {
                        setRingState(r => ({
                          ...r,
                          batteryLevel: Math.max(r.batteryLevel - 8, 3)
                        }));
                      }}
                      className={`p-2.5 rounded-xl border font-mono text-xs transition-colors ${
                        isDark
                          ? "border-[#222] bg-[#111] text-zinc-400 hover:text-white hover:border-[#FF3B30]"
                          : "border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:border-[#FF3B30]"
                      }`}
                      title="Drain ring battery quickly for testing low-power companion alarms"
                    >
                      Drain
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive SVG Smart Ring Render - styled bento-style */}
            <div className={`flex flex-col items-center py-6 rounded-[24px] border relative transition-all duration-300 hover:scale-[1.02] ${styles.innerBg} hover:border-[#FF3B30]/30`}>
              <span className={`absolute top-3 left-4 text-[9px] font-mono uppercase tracking-wider ${styles.textMuted}`}>Pressure Sensors Visual</span>
              
              <div className="relative w-44 h-44 flex items-center justify-center">
                {/* Simulated Halo LED Light ring */}
                <motion.div 
                  className={`absolute rounded-full border-4 transition-all duration-300 ${
                    sosActive 
                      ? "w-40 h-40 border-red-500/80 pulse-glow-red" 
                      : ringState.currentSqueezeInput.length > 0 
                      ? "w-38 h-38 border-amber-400/80 pulse-glow-amber"
                      : isDark ? "w-36 h-36 border-[#222]" : "w-36 h-36 border-slate-200"
                  }`}
                  animate={{ rotate: ringRotation }}
                  style={{ transformOrigin: "center" }}
                />

                {isVibrating && (
                  <>
                    <motion.div 
                      className="absolute w-36 h-36 rounded-full border border-red-500/50"
                      initial={{ scale: 0.95, opacity: 0.9 }}
                      animate={{ scale: 1.45, opacity: 0 }}
                      transition={{ repeat: Infinity, duration: selectedHapticPattern === "staccato" ? 0.25 : selectedHapticPattern === "pulse" ? 0.7 : 1.1, ease: "easeOut" }}
                    />
                    <motion.div 
                      className="absolute w-36 h-36 rounded-full border border-[#FF3B30]/25"
                      initial={{ scale: 0.85, opacity: 0.7 }}
                      animate={{ scale: 1.65, opacity: 0 }}
                      transition={{ repeat: Infinity, duration: selectedHapticPattern === "staccato" ? 0.25 : selectedHapticPattern === "pulse" ? 0.7 : 1.1, ease: "easeOut", delay: 0.15 }}
                    />
                  </>
                )}

                {/* Main 3D Smart Ring Body with Haptic Shake Animation */}
                <motion.div
                  animate={isVibrating ? {
                    x: selectedHapticPattern === "staccato" 
                      ? [0, -3, 3, -3, 3, 0] 
                      : selectedHapticPattern === "pulse"
                      ? [0, -1.5, 1.5, -1.5, 1.5, 0]
                      : [0, -2, 2, -2, 2, 0],
                    y: selectedHapticPattern === "staccato"
                      ? [0, 3, -3, 3, -3, 0]
                      : selectedHapticPattern === "pulse"
                      ? [0, 1.5, -1.5, 1.5, -1.5, 0]
                      : [0, 2, -2, 2, -2, 0],
                  } : {}}
                  transition={isVibrating ? {
                    repeat: Infinity,
                    duration: selectedHapticPattern === "staccato" ? 0.12 : selectedHapticPattern === "pulse" ? 0.5 : 0.2,
                  } : undefined}
                >
                  <svg width="120" height="120" viewBox="0 0 100 100" className="drop-shadow-2xl">
                    {/* Outer bezel */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="44" 
                      fill={
                        ringState.selectedColor === RingColor.COSMIC_OBSIDIAN ? "#18181b" :
                        ringState.selectedColor === RingColor.AURELIA_GOLD ? "#d97706" : "#71717a"
                      }
                      stroke={
                        ringState.selectedColor === RingColor.COSMIC_OBSIDIAN ? "#27272a" :
                        ringState.selectedColor === RingColor.AURELIA_GOLD ? "#fbbf24" : "#e4e4e7"
                      }
                      strokeWidth="3"
                    />
                    
                    {/* Outer grip ridge */}
                    <circle cx="50" cy="50" r="41" fill="none" stroke={isDark ? "#09090b" : "#cbd5e1"} strokeWidth="1" strokeDasharray="3,3" />

                    {/* Smart Ring Inner circle (finger space) */}
                    <circle cx="50" cy="50" r="30" fill={isDark ? "#09090b" : "#f1f5f9"} stroke={isDark ? "#1c1917" : "#cbd5e1"} strokeWidth="2" />
                    
                    {/* Dynamic LED Center status light */}
                    <circle 
                      cx="50" 
                      cy="14" 
                      r="4" 
                      fill={sosActive ? "#ef4444" : ringState.currentSqueezeInput.length > 0 ? "#fbbf24" : isVibrating ? "#ff3b30" : "#10b981"}
                      className={sosActive || ringState.currentSqueezeInput.length > 0 || isVibrating ? "animate-ping" : ""}
                    />
                    <circle 
                      cx="50" 
                      cy="14" 
                      r="3" 
                      fill={sosActive ? "#f87171" : ringState.currentSqueezeInput.length > 0 ? "#fcd34d" : isVibrating ? "#ff6b6b" : "#34d399"} 
                    />

                    {/* Pressure Sensor Grip Indicator overlays */}
                    <path d="M 12,50 A 38,38 0 0,1 21,24" fill="none" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" opacity="0.3" />
                    <path d="M 88,50 A 38,38 0 0,0 79,24" fill="none" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" opacity="0.3" />
                  </svg>
                </motion.div>
                
                {/* Absolute status text overlay */}
                <div className={`absolute bottom-1 border text-[10px] px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1.5 shadow-md ${isDark ? "bg-[#111] border-[#222] text-zinc-300" : "bg-white border-slate-200 text-slate-700"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sosActive ? "bg-red-500 animate-pulse" : isVibrating ? "bg-red-400 animate-bounce" : "bg-emerald-400"}`}></span>
                  {sosActive ? "BROADCAST ACTIVE" : isVibrating ? "HAPTIC VIBRATING" : "BLE IDLE SECURE"}
                </div>
              </div>

              {/* Physical interaction triggers */}
              {ringSimTab === "control" ? (
                <div className="w-full px-4 flex flex-col gap-3 mt-2">
                  <p className={`text-[10.5px] text-center ${styles.textSec} transition-colors`}>Click below to simulate squeezing the physical ring pressure plate:</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      id="btn-short-press"
                      onClick={() => addSqueezeInput("Short")}
                      className={`py-3 active:scale-95 border hover:border-[#FF3B30] rounded-xl font-mono text-xs font-semibold flex flex-col items-center justify-center transition-all shadow-md ${
                        isDark 
                          ? "bg-[#1A1A1A] hover:bg-[#252525] border-[#333] text-white" 
                          : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-900"
                      }`}
                    >
                      <span>Short Squeeze</span>
                      <span className={`text-[9px] font-normal mt-0.5 ${styles.textMuted}`}>&lt; 0.5 sec tap</span>
                    </button>

                    <button
                      id="btn-long-press"
                      onClick={() => addSqueezeInput("Long")}
                      className={`py-3 active:scale-95 border hover:border-[#FF3B30] rounded-xl font-mono text-xs font-semibold flex flex-col items-center justify-center transition-all shadow-md ${
                        isDark 
                          ? "bg-[#1A1A1A] hover:bg-[#252525] border-[#333] text-white" 
                          : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-900"
                      }`}
                    >
                      <span>Long Squeeze</span>
                      <span className={`text-[9px] font-normal mt-0.5 ${styles.textMuted}`}>&gt; 1.5 sec hold</span>
                    </button>
                  </div>

                  {/* Queue Display */}
                  <div className={`border rounded-xl p-2.5 flex items-center justify-between text-[11px] ${isDark ? "bg-[#111] border-[#222]" : "bg-white border-slate-200"}`}>
                    <span className={`font-mono text-[10px] uppercase ${styles.textSec}`}>Squeeze Queue:</span>
                    <div className="flex gap-1.5">
                      <AnimatePresence mode="popLayout">
                        {ringState.currentSqueezeInput.length === 0 ? (
                          <motion.span 
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={`font-mono italic ${isDark ? "text-zinc-600" : "text-slate-400"}`}
                          >
                            Awaiting pattern...
                          </motion.span>
                        ) : (
                          ringState.currentSqueezeInput.map((input, idx) => (
                            <motion.span 
                              key={idx} 
                              initial={{ opacity: 0, scale: 0.8, x: 6 }}
                              animate={{ opacity: 1, scale: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ type: "spring", stiffness: 450, damping: 18 }}
                              className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                                input === "Short" 
                                  ? isDark ? "bg-[#1A1A1A] text-zinc-300 border border-[#333]" : "bg-slate-100 text-slate-700 border border-slate-200"
                                  : "bg-red-950 text-[#FF3B30] border border-red-900"
                              }`}
                            >
                              {input.toUpperCase()}
                            </motion.span>
                          ))
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full px-4 flex flex-col gap-4 mt-2">
                  <div className={`border-b pb-2 ${styles.divider}`}>
                    <h3 className={`text-xs font-bold uppercase font-mono tracking-wider ${styles.textStrong}`}>Haptic Diagnostic Lab</h3>
                    <p className={`text-[10px] ${styles.textMuted}`}>Select pattern, customize duration, and trigger ring vibration</p>
                  </div>

                  {/* Pattern buttons */}
                  <div className="flex flex-col gap-1.5">
                    <span className={`text-[10px] font-mono uppercase tracking-wider block ${styles.textSec}`}>Select Pattern:</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "pulse", label: "Heartbeat Pulse", desc: "Steady double pulse" },
                        { id: "staccato", label: "Staccato Alert", desc: "Rapid intermittent" },
                        { id: "long-hold", label: "Long Hold", desc: "Continuous vibration" }
                      ].map((pat) => (
                        <button
                          key={pat.id}
                          id={`btn-haptic-pat-${pat.id}`}
                          onClick={() => {
                            setSelectedHapticPattern(pat.id as any);
                            if (isVibrating) {
                              triggerHapticDiagnostic(pat.id as any, hapticDuration);
                            }
                          }}
                          className={`p-2 rounded-xl border font-mono text-center transition-all ${
                            selectedHapticPattern === pat.id
                              ? "bg-[#FF3B30] text-white border-[#FF3B30] shadow-sm"
                              : isDark
                              ? "bg-[#111] border-[#222] text-zinc-300 hover:border-zinc-500"
                              : "bg-white border-slate-200 text-slate-700 hover:border-slate-400"
                          }`}
                        >
                          <span className="text-[10px] font-bold block">{pat.label}</span>
                          <span className={`text-[8px] font-normal block mt-0.5 opacity-80`}>{pat.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duration Slider */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className={`font-mono uppercase tracking-wider ${styles.textSec}`}>Vibration Duration:</span>
                      <span className={`font-mono font-bold text-[#FF3B30] bg-[#FF3B30]/10 px-2 py-0.5 rounded`}>
                        {hapticDuration.toFixed(1)} seconds
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        id="haptic-duration-slider"
                        type="range"
                        min="0.5"
                        max="5.0"
                        step="0.5"
                        value={hapticDuration}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setHapticDuration(val);
                          if (isVibrating) {
                            triggerHapticDiagnostic(selectedHapticPattern, val);
                          }
                        }}
                        className="flex-1 accent-[#FF3B30] cursor-pointer h-1.5 rounded-lg bg-zinc-800"
                      />
                      <div className="flex gap-1">
                        {[1.0, 2.0, 4.0].map((presetSec) => (
                          <button
                            key={presetSec}
                            id={`btn-duration-preset-${presetSec}`}
                            onClick={() => {
                              setHapticDuration(presetSec);
                              if (isVibrating) {
                                triggerHapticDiagnostic(selectedHapticPattern, presetSec);
                              }
                            }}
                            className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded border ${
                              hapticDuration === presetSec
                                ? "bg-[#FF3B30]/20 text-[#FF3B30] border-[#FF3B30]/40"
                                : isDark
                                ? "bg-[#111] border-[#222] text-zinc-400 hover:text-white"
                                : "bg-white border-slate-200 text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            {presetSec}s
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action trigger button */}
                  <div className="flex gap-2">
                    <button
                      id="btn-trigger-diagnostic"
                      onClick={() => triggerHapticDiagnostic(selectedHapticPattern, hapticDuration)}
                      className={`flex-1 py-3 bg-[#FF3B30] hover:bg-red-600 text-white rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                        isVibrating ? "animate-pulse" : ""
                      }`}
                    >
                      <Activity className={`w-4 h-4 ${isVibrating ? "animate-spin" : ""}`} />
                      {isVibrating ? "RE-TEST HAPTIC PULSE" : "TEST PATTERN ON VIRTUAL RING"}
                    </button>
                    {isVibrating && (
                      <button
                        id="btn-stop-diagnostic"
                        onClick={() => {
                          if (vibrationTimer) clearTimeout(vibrationTimer);
                          setIsVibrating(false);
                          setRingState(r => ({ ...r, lastHapticFeedback: "⏹️ Diagnostic test stopped manually." }));
                        }}
                        className={`px-4 py-3 border border-red-500/30 text-[#FF3B30] hover:bg-red-500/10 rounded-xl font-mono text-xs font-bold transition-all`}
                      >
                        STOP
                      </button>
                    )}
                  </div>

                  {/* Real-time D3.js Vibration telemetry visualization */}
                  <div className={`p-3 rounded-2xl border flex flex-col gap-2 font-mono text-[9px] uppercase tracking-wider ${
                    isVibrating 
                      ? isDark ? "bg-[#FF3B30]/5 border-red-950/40 text-[#FF3B30]" : "bg-red-50 border-red-100 text-red-600"
                      : isDark ? "bg-[#111]/40 border-[#222] text-zinc-500" : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}>
                    <div className="flex justify-between items-center font-bold text-[9.5px]">
                      <span className="flex items-center gap-1.5 text-[#FF3B30]">
                        <Activity className={`w-3.5 h-3.5 ${isVibrating ? "animate-pulse" : ""}`} />
                        HAPTIC SIGNAL TELEMETRY (D3.JS GRAPH)
                      </span>
                      <span>{isVibrating ? "STATUS: EMITTING VIBE" : "STATUS: STANDBY SENSING"}</span>
                    </div>
                    
                    <div className="relative w-full h-20 overflow-hidden rounded-xl bg-zinc-950 border border-zinc-900">
                      <svg 
                        ref={d3SvgRef} 
                        className="w-full h-full"
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-[8.5px] text-zinc-500">
                      <span>0.0s (Live)</span>
                      <span>{selectedHapticPattern.toUpperCase()} {isVibrating ? `(${hapticDuration.toFixed(1)}s duration)` : "STANDBY HUM"}</span>
                      <span>Real-time Waveform</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Dynamic Squeeze Customizer and feedback haptic log - styled bento-style */}
          <motion.div 
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className={`flex flex-col gap-3.5 rounded-[24px] p-5 text-xs transition-all duration-300 hover:scale-[1.02] hover:border-[#FF3B30]/30 ${styles.innerBg}`}
          >
            <div className="flex items-center justify-between">
              <span className={`font-mono text-[10px] uppercase tracking-wider ${styles.textSec}`}>Calibration Pattern setup</span>
              <span className={`text-[9px] font-mono uppercase ${styles.textMuted}`}>Tap slot to edit</span>
            </div>
            
            {/* Pattern display config */}
            <div className="flex items-center gap-2">
              {["1", "2", "3", "4"].map((step, idx) => {
                const val = ringState.calibrationPattern[idx];
                return (
                  <button
                    key={idx}
                    id={`btn-calibrate-step-${idx}`}
                    onClick={() => {
                      setRingState(prev => {
                        const pattern = [...prev.calibrationPattern];
                        pattern[idx] = pattern[idx] === "Short" ? "Long" : "Short";
                        return { ...prev, calibrationPattern: pattern, lastHapticFeedback: `Recalibrated trigger slot ${idx + 1} to ${pattern[idx]}` };
                      });
                    }}
                    className={`flex-1 p-2.5 border rounded-xl font-mono text-center text-[10.5px] font-bold transition-all ${
                      val === "Short" 
                        ? isDark ? "bg-[#111] border-[#222] text-zinc-300 hover:border-[#FF3B30]" : "bg-white border-slate-200 text-slate-700 hover:border-[#FF3B30]"
                        : "bg-red-950/35 border-red-900/60 text-[#FF3B30] hover:bg-red-950/50"
                    }`}
                  >
                    Slot {step}
                    <span className={`block text-[8px] font-normal mt-0.5 uppercase ${styles.textMuted}`}>{val}</span>
                  </button>
                );
              })}
            </div>

            {/* Haptic log display */}
            <div className={`border-t pt-3 flex items-start gap-2.5 font-mono text-[11px] ${styles.border}`}>
              <Activity className="w-4 h-4 text-[#FF3B30] shrink-0 mt-0.5 animate-pulse" />
              <div className="flex-1">
                <span className={`uppercase text-[9.5px] tracking-wider block mb-0.5 ${styles.textMuted}`}>Ring Haptic Feedback log</span>
                <p className={`font-medium leading-relaxed ${styles.textMain}`}>{ringState.lastHapticFeedback}</p>
              </div>
            </div>
          </motion.div>

          {/* AI On-Device Environmental Threat Microphone Listening - styled as Bento Box */}
          <motion.div 
            id="environmental-ai-card" 
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className={`rounded-[32px] p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden transition-all duration-300 ${styles.cardBg}`}
          >
              {/* Visual background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full filter blur-xl"></div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-[#FF3B30]" />
                  <span className={`font-semibold text-xs uppercase font-mono tracking-wider ${styles.textStrong}`}>Environmental Threat AI</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${micListening ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`}></span>
                  <span className={`text-[9px] font-mono uppercase tracking-wider ${styles.textSec}`}>Continuous Analyzer</span>
                </div>
              </div>

              {/* Microphone sound decibel bar visualization */}
              <div className={`p-4 rounded-[20px] flex items-center gap-4 transition-all duration-300 hover:scale-[1.02] hover:border-[#FF3B30]/30 ${styles.innerBg}`}>
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className={`flex items-center justify-between text-[10px] font-mono uppercase tracking-wider ${styles.textMuted}`}>
                    <span>Input Volume Decibels</span>
                    <span className={soundDbLevel > 75 ? "text-[#FF3B30] font-bold animate-pulse" : isDark ? "text-zinc-300" : "text-slate-700"}>{soundDbLevel} dB</span>
                  </div>
                  {/* Dynamic LED bar graph */}
                  <div className={`h-2.5 w-full rounded-full overflow-hidden flex gap-0.5 p-0.5 border ${isDark ? "bg-[#111] border-[#222]" : "bg-slate-200 border-slate-300"}`}>
                    {Array.from({ length: 15 }).map((_, idx) => {
                      const activeSlotsCount = Math.floor((soundDbLevel / 100) * 15);
                      const isActive = idx < activeSlotsCount;
                      const isDanger = idx > 11;
                      const isWarning = idx > 7 && idx <= 11;

                      let color = isDark ? "bg-[#1A1A1A]" : "bg-slate-100";
                      if (isActive) {
                        if (isDanger) color = "bg-[#FF3B30] animate-pulse";
                        else if (isWarning) color = "bg-amber-400";
                        else color = "bg-emerald-400";
                      }

                      return <div key={idx} className={`h-full flex-1 rounded-xs ${color}`} />;
                    })}
                  </div>
                </div>
                <button
                  id="btn-mic-toggle"
                  onClick={toggleRealMicrophone}
                  className={`p-3 rounded-xl border transition-all duration-200 shrink-0 ${
                    micListening 
                      ? "bg-red-950/50 border-red-800 text-[#FF3B30] hover:bg-red-900/60" 
                      : isDark
                      ? "bg-[#1A1A1A] border-[#333] text-zinc-300 hover:border-[#FF3B30] hover:text-white"
                      : "bg-slate-100 border-slate-200 text-slate-700 hover:border-[#FF3B30]"
                  }`}
                  title={micListening ? "Stop Microphone Speech Recognition" : "Activate Microphone Speech Recognition"}
                >
                  {micListening ? <Mic className="w-4 h-4 animate-bounce" /> : <MicOff className="w-4 h-4" />}
                </button>
              </div>

              {/* Web Speech active status message */}
              {isSpeechSupported && (
                <p className={`text-[11px] leading-relaxed font-sans border p-3 rounded-xl ${isDark ? "text-zinc-400 bg-[#050505] border-[#222]/60" : "text-slate-600 bg-slate-50 border-slate-200"}`}>
                  💡 <strong className={isDark ? "text-zinc-200 font-semibold" : "text-slate-800 font-semibold"}>Voice Trigger Active:</strong> Speak words like <span className="text-[#FF3B30] italic font-mono font-bold">"help"</span>, <span className="text-[#FF3B30] italic font-mono font-bold">"stop"</span>, <span className="text-[#FF3B30] italic font-mono font-bold">"police"</span>, or <span className="text-[#FF3B30] italic font-mono font-bold">"let go"</span> to trigger real automatic threat escalation.
                </p>
              )}

              {/* Pre-recorded Aggressive sound preset simulations */}
              <div className={`flex flex-col gap-2.5 border-t pt-4 ${styles.border}`}>
                <span className={`text-[10px] font-mono uppercase tracking-wider ${styles.textMuted}`}>Distress Scenario Preset Simulations</span>
                
                <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                  <button
                    id="btn-distress-preset-1"
                    onClick={() => simulateDistressPreset("Let go of me! Stop following!", true)}
                    className={`p-3 text-left rounded-xl border font-mono transition-all duration-300 hover:scale-[1.02] flex items-center justify-between shadow-md group ${
                      isDark 
                        ? "bg-[#1A1A1A] border-[#333] hover:bg-[#222] text-[#FF3B30] hover:border-[#FF3B30]" 
                        : "bg-red-50/50 border-red-200 hover:bg-red-50 text-red-700 hover:border-red-400"
                    }`}
                  >
                    <span className={`group-hover:${isDark ? "text-white" : "text-red-950"} font-medium`}>🗣️ Physical Assault</span>
                    <span className="text-[8px] bg-red-950 text-[#FF3B30] border border-red-900 px-1.5 py-0.5 rounded-full font-bold uppercase shrink-0">High</span>
                  </button>

                  <button
                    id="btn-distress-preset-2"
                    onClick={() => simulateDistressPreset("Help! Please call the police!", true)}
                    className={`p-3 text-left rounded-xl border font-mono transition-all duration-300 hover:scale-[1.02] flex items-center justify-between shadow-md group ${
                      isDark 
                        ? "bg-[#1A1A1A] border-[#333] hover:bg-[#222] text-[#FF3B30] hover:border-[#FF3B30]" 
                        : "bg-red-50/50 border-red-200 hover:bg-red-50 text-red-700 hover:border-red-400"
                    }`}
                  >
                    <span className={`group-hover:${isDark ? "text-white" : "text-red-950"} font-medium`}>🚨 Help Dispatch</span>
                    <span className="text-[8px] bg-red-950 text-[#FF3B30] border border-red-900 px-1.5 py-0.5 rounded-full font-bold uppercase shrink-0">Critical</span>
                  </button>

                  <button
                    id="btn-distress-preset-3"
                    onClick={() => simulateDistressPreset("Just walking home on Main St, catching a train.", false)}
                    className={`p-3 text-left rounded-xl border font-mono transition-all duration-300 hover:scale-[1.02] flex items-center justify-between shadow-md group ${
                      isDark 
                        ? "bg-[#1A1A1A] border-[#333] hover:bg-[#222] text-zinc-400 hover:border-zinc-600" 
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <span className={`group-hover:${isDark ? "text-zinc-200" : "text-slate-800"}`}>🚶 Walking Home</span>
                    <span className="text-[8px] bg-emerald-950 text-emerald-400 border border-emerald-900 px-1.5 py-0.5 rounded-full font-bold uppercase shrink-0">Safe</span>
                  </button>

                  <button
                    id="btn-distress-preset-4"
                    onClick={() => simulateDistressPreset("Stop, there is someone following me behind that corner, I feel unsafe.", false)}
                    className={`p-3 text-left rounded-xl border font-mono transition-all duration-300 hover:scale-[1.02] flex items-center justify-between shadow-md group ${
                      isDark 
                        ? "bg-[#1A1A1A] border-[#333] hover:bg-[#222] text-amber-400 hover:border-amber-500" 
                        : "bg-amber-50/50 border-amber-200 hover:bg-amber-50 text-amber-700 hover:border-amber-400"
                    }`}
                  >
                    <span className={`group-hover:${isDark ? "text-zinc-200" : "text-slate-800"}`}>🤫 Stalking Pursuit</span>
                    <span className="text-[8px] bg-amber-950 text-amber-400 border border-amber-900 px-1.5 py-0.5 rounded-full font-bold uppercase shrink-0">Elevate</span>
                  </button>
                </div>
              </div>

              {/* Custom manual speech evaluator */}
              <div className={`flex flex-col gap-1.5 mt-1 p-4 rounded-[20px] transition-all duration-300 hover:scale-[1.02] hover:border-[#FF3B30]/30 ${styles.innerBg}`}>
                <label className={`text-[9.5px] font-mono uppercase tracking-wider ${styles.textMuted}`}>Custom Verbal Test Input</label>
                <div className="flex gap-2.5">
                  <input
                    id="input-vocal-speech"
                    type="text"
                    value={customVocalSpeech}
                    onChange={(e) => setCustomVocalSpeech(e.target.value)}
                    placeholder="Enter warning words or sentences..."
                    className={`flex-1 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#FF3B30] font-mono transition-colors ${styles.inputBg}`}
                  />
                  <button
                    id="btn-submit-vocal-speech"
                    onClick={() => {
                      simulateDistressPreset(customVocalSpeech || "Stop it, go away!", false);
                      setCustomVocalSpeech("");
                    }}
                    className="px-4 py-2.5 bg-[#FF3B30] text-white hover:bg-[#D32F2F] rounded-xl text-xs font-semibold transition-all shrink-0 font-mono uppercase tracking-wider shadow-lg shadow-red-600/10"
                  >
                    Evaluate
                  </button>
                </div>
              </div>

              {/* Environmental AI Console / Speech Log Terminal */}
              <div className={`rounded-[24px] p-5 font-mono text-[10.5px] leading-relaxed shadow-inner transition-all duration-300 hover:scale-[1.02] hover:border-[#FF3B30]/30 ${styles.innerBg}`}>
                <div className={`flex items-center justify-between border-b pb-2 mb-2 ${styles.divider} ${styles.textMuted}`}>
                  <span className="text-[9px] tracking-wider uppercase font-bold">Environmental AI Log</span>
                  <span className={`text-[9px] border px-2 py-0.5 rounded-full ${isDark ? "bg-[#1A1A1A] border-[#222] text-zinc-400" : "bg-white border-slate-200 text-slate-600"}`}>{activeVoiceTriggerState}</span>
                </div>
                
                <div className={`flex flex-col gap-1.5 ${styles.textMain}`}>
                  <div className="flex items-start gap-1">
                    <span className={`shrink-0 select-none ${styles.textMuted}`}>&gt; Recog:</span> 
                    <span className={`italic ${styles.textStrong}`}>{speechTranscript ? `"${speechTranscript}"` : "Awaiting microphone input or preset click..."}</span>
                  </div>
                  
                  {aiFeedback && (
                    <div className={`mt-1.5 border-t pt-2 flex flex-col gap-1.5 ${styles.divider}`}>
                      <div className="flex justify-between items-center">
                        <span className={`text-[9.5px] uppercase tracking-wider ${styles.textMuted}`}>Risk Threat Score:</span>
                        <span className={`font-mono font-bold text-xs ${aiFeedback.riskScore >= 80 ? "text-[#FF3B30]" : "text-amber-500"}`}>
                          {aiFeedback.riskScore}/100
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-[9.5px] uppercase tracking-wider ${styles.textMuted}`}>Classification:</span>
                        <span className={`font-bold ${styles.textStrong}`}>{aiFeedback.threatType}</span>
                      </div>
                      <div className={`text-[10px] leading-relaxed p-2.5 rounded-lg border ${isDark ? "bg-[#111] border-[#222]/50 text-zinc-400" : "bg-white border-slate-200 text-slate-700"}`}>
                        {aiFeedback.briefAssessment}
                      </div>
                      {aiFeedback.keyKeywords && aiFeedback.keyKeywords.length > 0 && (
                        <div className={`text-[9.5px] flex gap-1 mt-0.5 items-center ${styles.textMuted}`}>
                          <span className="uppercase tracking-wider">Triggers Detected:</span>
                          <span className="text-[#FF3B30] font-bold bg-red-950/40 border border-red-900/30 px-1.5 py-0.5 rounded text-[8.5px] uppercase font-mono">{aiFeedback.keyKeywords.join(", ")}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </motion.div>

        </section>

        {/* ========================================================
            RIGHT COLUMN: SMARTPHONE COMPANION APP PREVIEW 
            ======================================================== */}
        <section id="phone-preview-column" className="lg:col-span-7 flex justify-center items-start">
          
          {/* Smartphone Frame Mockup - Styled beautifully as a Bento Device Mockup */}
          <motion.div 
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={`w-full max-w-[420px] border-[10px] rounded-[48px] shadow-2xl relative overflow-hidden flex flex-col aspect-[9/19.5] transition-colors duration-300 ${
              isDark ? "bg-[#050505] border-[#222]" : "bg-slate-100 border-slate-300 shadow-slate-200/50"
            }`}
          >
            
            {/* Phone Top Camera / Speaker pill notch */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 rounded-b-2xl z-50 flex items-center justify-center transition-colors ${
              isDark ? "bg-[#222]" : "bg-slate-300"
            }`}>
              <div className={`w-12 h-1 rounded-full mb-1 transition-colors ${isDark ? "bg-zinc-900" : "bg-slate-400"}`}></div>
            </div>

            {/* Smartphone Top Info bar */}
            <div className={`text-[11px] font-mono px-6 pt-7 pb-2.5 flex items-center justify-between select-none border-b z-40 transition-colors duration-300 ${
              isDark ? "bg-[#111]/90 backdrop-blur-md text-zinc-400 border-[#222]" : "bg-white/90 backdrop-blur-md text-slate-500 border-slate-200"
            }`}>
              <span className={`font-semibold ${isDark ? "text-zinc-300" : "text-slate-700"}`}>{currentTime}</span>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] border px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                  isDark ? "bg-[#1A1A1A] border-[#222] text-zinc-400" : "bg-slate-100 border-slate-200 text-slate-600"
                }`}>5G</span>
                <div className="flex items-center gap-0.5" title="Companion-Ring BLE signal strength">
                  <span className="w-0.5 h-1 bg-emerald-400 rounded-xs"></span>
                  <span className="w-0.5 h-1.5 bg-emerald-400 rounded-xs"></span>
                  <span className="w-0.5 h-2 bg-emerald-400 rounded-xs"></span>
                  <span className="w-0.5 h-2.5 bg-emerald-400 rounded-xs"></span>
                </div>
                <div className="flex items-center gap-1">
                  <Battery className={`w-3.5 h-3.5 ${isDark ? "text-zinc-300" : "text-slate-600"}`} />
                  <span className={`text-[9px] font-bold ${isDark ? "text-zinc-300" : "text-slate-600"}`}>89%</span>
                </div>
              </div>
            </div>

            {/* companion App View Area */}
            <div className={`flex-1 overflow-y-auto flex flex-col relative transition-colors duration-300 ${
              isDark ? "bg-[#050505]" : "bg-slate-50"
            }`}>
              <AnimatePresence mode="wait">
                
                {/* 1. Onboarding Screen */}
                {!isOnboarded ? (
                  <motion.div 
                    key="onboarding"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col p-6 justify-between text-center relative overflow-hidden"
                  >
                    {/* Ring graphics bg */}
                    <div className={`absolute -top-12 -right-12 w-48 h-48 rounded-full border transition-colors ${
                      isDark ? "bg-[#111] border-[#222]/20" : "bg-slate-200/50 border-slate-300/20"
                    }`}></div>
                    <div className="absolute bottom-24 -left-12 w-32 h-32 bg-red-950/10 rounded-full filter blur-xl"></div>

                    {/* App badge logo */}
                    <div className="mt-14 flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl bg-[#FF3B30] shadow-xl shadow-[#FF3B30]/20 flex items-center justify-center mb-4">
                        <Shield className="w-8 h-8 text-white" />
                      </div>
                      <h2 className={`text-2xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>GUARDIAN<span className="text-[#FF3B30]">HALO</span></h2>
                      <span className={`font-mono text-[9px] uppercase tracking-widest mt-1.5 ${isDark ? "text-zinc-500" : "text-slate-400"}`}>Personal Protection Network</span>
                    </div>

                    {/* Animated Text Reveal (MANDATORY SPEC REQUIREMENT) */}
                    <div className="my-8 px-2 flex flex-col justify-center items-center min-h-[90px]">
                      <AnimatedTextReveal 
                        text="Your Safety. In One Silent Squeeze." 
                        variant="onboarding" 
                      />
                      <p className={`text-xs mt-3 max-w-[280px] leading-relaxed ${isDark ? "text-zinc-400" : "text-slate-600"}`}>
                        The smart IoT ring that acts before phone-unlocking can happen. Silent, community-backed, and AI vigilant.
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="mb-6 flex flex-col gap-3">
                      <button
                        id="btn-onboarding-next"
                        onClick={() => setIsOnboarded(true)}
                        className="w-full py-3.5 bg-[#FF3B30] text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-red-600/25 active:scale-95 transition-all hover:bg-[#D32F2F]"
                      >
                        Enter Device Dashboard
                      </button>
                      <div className={`flex items-center justify-center gap-1 text-[10px] font-mono uppercase tracking-wider ${isDark ? "text-zinc-500" : "text-slate-400"}`}>
                        <Lock className="w-3 h-3 text-[#FF3B30]" /> End-to-End Cryptography Certified
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  
                  // 2. Main Companion Application Framework
                  <motion.div 
                    key="app-main"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col justify-between"
                  >
                    
                    {/* Dynamic Tabs Body */}
                    <div className="flex-1 p-5 overflow-y-auto relative">
                      <AnimatePresence mode="wait">
                        {/* T1: DASHBOARD VIEW */}
                        {activeTab === "dashboard" && (
                          <motion.div
                            key="tab-dashboard"
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            id="tab-dashboard"
                            className="flex flex-col gap-5"
                          >
                          
                          {/* Top Quick Status Badge */}
                          <motion.div 
                            variants={itemVariants}
                            className={`rounded-[24px] p-4 flex items-center justify-between shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-[#FF3B30]/30 ${styles.cardBg}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl border transition-colors ${
                                isDark ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/50" : "bg-emerald-50 text-emerald-600 border-emerald-200"
                              }`}>
                                <Bluetooth className="w-5 h-5 animate-pulse" />
                              </div>
                              <div>
                                <span className={`text-[9px] font-mono block uppercase tracking-wider ${styles.textMuted}`}>IoT Connection</span>
                                <span className={`text-xs font-semibold ${styles.textStrong}`}>Ring Connected &amp; Paired</span>
                              </div>
                            </div>
                            <span className="text-[9px] font-mono font-bold bg-emerald-950/50 border border-emerald-800 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Active
                            </span>
                          </motion.div>

                          {/* Quick Squeeze Action Blueprint Banner */}
                          <motion.div 
                            variants={itemVariants}
                            className={`rounded-[24px] p-4 text-xs shadow-sm flex flex-col gap-2 transition-all duration-300 hover:scale-[1.02] hover:border-[#FF3B30]/30 ${styles.cardBg}`}
                          >
                            <div className={`flex items-center gap-2 ${styles.textSec}`}>
                              <Zap className="w-4 h-4 text-[#FF3B30]" />
                              <span className={`font-mono text-[10px] uppercase tracking-wider ${styles.textSec}`}>SOS Squeeze Trigger calibration:</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {ringState.calibrationPattern.map((step, i) => (
                                <span key={i} className={`px-2.5 py-1 rounded-full font-mono text-[9px] font-bold uppercase border transition-colors ${
                                  isDark ? "bg-[#050505] text-zinc-300 border-[#222]" : "bg-slate-50 text-slate-700 border-slate-200"
                                }`}>
                                  {step}
                                </span>
                              ))}
                              <span className={`text-[10px] ml-1 font-mono uppercase tracking-wider ${styles.textMuted}`}>Pattern</span>
                            </div>
                          </motion.div>

                          {/* Emergency Trigger buttons */}
                          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
                            <button
                              id="btn-companion-panic"
                              onClick={() => activateSOSFlow("Smartphone Manual Distress Screen Button")}
                              className="p-4 bg-[#FF3B30]/10 hover:bg-[#FF3B30]/25 border border-[#FF3B30]/35 hover:border-[#FF3B30] text-[#FF3B30] rounded-[24px] flex flex-col items-center justify-center text-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-md"
                            >
                              <AlertOctagon className="w-6 h-6 animate-pulse" />
                              <div>
                                <span className="text-xs font-bold block uppercase tracking-wider">Manual SOS</span>
                                <span className="text-[9px] text-red-500/80 font-normal">Immediate dispatch</span>
                              </div>
                            </button>

                            <button
                              id="btn-companion-test-countdown"
                              onClick={() => {
                                activateSOSFlow("App 10s Simulated Dispatch Drill");
                              }}
                              className={`p-4 rounded-[24px] flex flex-col items-center justify-center text-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-md border hover:border-[#FF3B30] ${
                                isDark ? "bg-[#111] hover:bg-[#1A1A1A] border-[#222] text-zinc-300" : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                              }`}
                            >
                              <RefreshCw className="w-6 h-6 text-amber-500 animate-spin-slow" />
                              <div>
                                <span className={`text-xs font-bold block uppercase tracking-wider ${styles.textStrong}`}>Test Drill</span>
                                <span className={`text-[9px] font-normal ${styles.textMuted}`}>10s cancel drill</span>
                              </div>
                            </button>
                          </motion.div>

                          {/* Companion Ring Diagnostic Dashboard Stats */}
                          <motion.div 
                            variants={itemVariants}
                            className={`rounded-[24px] p-5 flex flex-col gap-4 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-[#FF3B30]/30 ${styles.cardBg}`}
                          >
                            <span className={`text-[10px] font-mono uppercase tracking-wider border-b pb-2 ${styles.divider} ${styles.textSec}`}>Halo Diagnostic Telemetry</span>
                            
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className={`p-3 rounded-xl border flex flex-col gap-1 transition-colors ${isDark ? "bg-[#050505] border-[#222]" : "bg-slate-50 border-slate-200"}`}>
                                <span className={`text-[9px] uppercase tracking-wider font-mono ${styles.textMuted}`}>Ring Power Level</span>
                                <div className="flex items-center gap-1.5 font-mono">
                                  <Battery className="w-4 h-4 text-green-500" />
                                  <span className={`font-bold ${styles.textStrong}`}>{ringState.batteryLevel}%</span>
                                </div>
                              </div>

                              <div className={`p-3 rounded-xl border flex flex-col gap-1 transition-colors ${isDark ? "bg-[#050505] border-[#222]" : "bg-slate-50 border-slate-200"}`}>
                                <span className={`text-[9px] uppercase tracking-wider font-mono ${styles.textMuted}`}>Haptic Driver</span>
                                <div className="flex items-center gap-1.5 font-mono">
                                  <Activity className="w-4 h-4 text-rose-400" />
                                  <span className={`font-bold ${styles.textStrong}`}>LRA Linear</span>
                                </div>
                              </div>

                              <div className={`p-3 rounded-xl border flex flex-col gap-1 transition-colors ${isDark ? "bg-[#050505] border-[#222]" : "bg-slate-50 border-slate-200"}`}>
                                <span className={`text-[9px] uppercase tracking-wider font-mono ${styles.textMuted}`}>On-Ring Mic</span>
                                <span className="text-[9.5px] text-green-400 font-bold font-mono uppercase">VIGILANT ON</span>
                              </div>

                              <div className={`p-3 rounded-xl border flex flex-col gap-1 transition-colors ${isDark ? "bg-[#050505] border-[#222]" : "bg-slate-50 border-slate-200"}`}>
                                <span className={`text-[9px] uppercase tracking-wider font-mono ${styles.textMuted}`}>Firmware Version</span>
                                <span className={`font-bold font-mono ${styles.textMain}`}>{ringState.firmwareVersion}</span>
                              </div>
                            </div>
                          </motion.div>

                          {/* Proactive CrowdShield Network Status Card */}
                          <motion.div 
                            variants={itemVariants}
                            className={`rounded-[24px] p-5 flex flex-col gap-4 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-[#FF3B30]/30 ${styles.cardBg}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Radio className="w-4 h-4 text-[#FF3B30] animate-pulse" />
                                <span className={`font-mono text-[10px] uppercase tracking-wider ${styles.textStrong}`}>CrowdShield Broadcast Mesh</span>
                              </div>
                              <button
                                id="btn-toggle-crowdshield"
                                onClick={() => setCrowdShieldEnabled(!crowdShieldEnabled)}
                                className={`px-2.5 py-1 rounded-full text-[9px] font-mono tracking-wider transition-all border ${
                                  crowdShieldEnabled 
                                    ? "bg-emerald-950 text-emerald-400 border-emerald-800" 
                                    : isDark 
                                    ? "bg-[#1A1A1A] text-zinc-400 border border-[#333]" 
                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                                }`}
                              >
                                {crowdShieldEnabled ? "ENABLED" : "DISABLED"}
                              </button>
                            </div>
                            
                            <p className={`text-[11px] leading-relaxed font-sans ${styles.textSec}`}>
                              When enabled, a silent security beacon broadcasts anonymous geo-telemetry to certified neighbors within a 200m radius if you activate SOS.
                            </p>

                            <div className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-mono transition-colors ${
                              isDark ? "bg-[#050505] border-[#222] text-zinc-300" : "bg-slate-50 border-slate-200 text-slate-700"
                            }`}>
                              <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span className="leading-normal">There are <strong className={`font-bold ${styles.textStrong}`}>{responders.length} Guardians</strong> within 200m of your location.</span>
                            </div>
                          </motion.div>

                        </motion.div>
                      )}

                      {/* T2: ALERT MODE PAGE (MANDATORY SPEC REQUIREMENT) */}
                      {activeTab === "alert" && (
                        <motion.div
                          key="tab-alert"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.22, ease: "easeInOut" }}
                          id="tab-alert"
                          className="flex flex-col gap-5 justify-between h-full"
                        >
                          
                          {/* Alert Header indicator */}
                          <div className={`border rounded-[24px] p-4 text-center relative overflow-hidden transition-colors duration-300 ${
                            isDark ? "bg-red-950/10 border-[#FF3B30]/30" : "bg-red-50 border-red-200"
                          }`}>
                            <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF3B30] animate-pulse"></div>
                            
                            <div className="flex items-center justify-center gap-2 text-[#FF3B30] font-mono text-[9px] tracking-wider uppercase mb-1 font-bold">
                              <Radio className="w-3.5 h-3.5 animate-bounce" /> Silent Alarm Beacon Active
                            </div>
                            
                            {/* Animated Text Reveal component (Help Is On The Way) */}
                            <div className="min-h-[50px] flex items-center justify-center py-1">
                              {sosActive ? (
                                <AnimatedTextReveal 
                                  text="Help Is On The Way." 
                                  variant="emergency" 
                                />
                              ) : (
                                <span className={`italic text-xs font-mono uppercase tracking-wider text-[9px] ${styles.textMuted}`}>No active SOS beacon broadcast</span>
                              )}
                            </div>
                          </div>

                          {/* Massive pulsing emergency radar visual */}
                          <div className={`flex flex-col items-center py-6 border rounded-[24px] relative overflow-hidden shadow-inner transition-colors duration-300 ${styles.innerBg}`}>
                            <div className="absolute top-2 left-3 font-mono text-[8px] text-[#FF3B30] bg-red-950/30 border border-red-900/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              GPS Stream: {sosLocation.lat.toFixed(5)}, {sosLocation.lng.toFixed(5)}
                            </div>

                            {/* Concentric pulsing circles */}
                            <div className="relative w-36 h-36 flex items-center justify-center my-4">
                              <div className="absolute w-32 h-32 rounded-full border border-[#FF3B30]/20 animate-ping"></div>
                              <div className="absolute w-24 h-24 rounded-full border border-[#FF3B30]/40 animate-pulse"></div>
                              <div className="absolute w-16 h-16 rounded-full bg-red-950/60 border-2 border-[#FF3B30] flex items-center justify-center shadow-lg shadow-red-500/20">
                                <Shield className="w-7 h-7 text-[#FF3B30] animate-bounce" />
                              </div>
                            </div>

                            {/* Live Countdown Clock */}
                            <div className="text-center mt-3">
                              {sosDispatched ? (
                                <div className="flex flex-col items-center">
                                  <span className="text-xs text-emerald-400 font-mono uppercase tracking-widest font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4" /> Authorities Dispatched
                                  </span>
                                  <p className={`text-[10px] max-w-[280px] mt-1 text-center font-mono uppercase tracking-wider ${styles.textMuted}`}>
                                    Encrypted location beacon, live audio snips, and SMS messages fully broadcast.
                                  </p>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <div className={`text-4xl font-mono font-bold tracking-widest ${styles.textStrong}`}>
                                    00:{String(sosCountdown).padStart(2, "0")}
                                  </div>
                                  <span className={`text-[9px] font-mono uppercase tracking-wider block mt-1.5 ${styles.textMuted}`}>
                                    Auto Dispatch Countdown
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Active Alert Step Progression checklist */}
                          <div className={`rounded-[24px] p-5 flex flex-col gap-3 text-xs font-mono shadow-sm ${styles.cardBg}`}>
                            <span className={`uppercase tracking-wider border-b pb-2 text-[9px] font-bold ${styles.divider} ${styles.textMuted}`}>Broadcast Status Check:</span>
                            
                            <div className="flex flex-col gap-2.5">
                              {/* Squeeze validation */}
                              <div className={`flex items-center justify-between ${styles.textMain}`}>
                                <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  <span className="text-[10px] uppercase">Ring Gesture Activation</span>
                                </div>
                                <span className="text-[9px] font-bold text-emerald-400 uppercase">Triggered</span>
                              </div>

                              {/* GPS Track */}
                              <div className={`flex items-center justify-between ${styles.textMain}`}>
                                <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                  <span className="text-[10px] uppercase">E-911 Location Lock</span>
                                </div>
                                <span className="text-[9px] font-bold text-emerald-400 uppercase">Lock (E-911)</span>
                              </div>

                              {/* Contact SMS */}
                              <div className={`flex items-center justify-between ${styles.textMain}`}>
                                <div className="flex items-center gap-2">
                                  <span className={`w-1.5 h-1.5 rounded-full ${sosDispatched ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`}></span>
                                  <span className="text-[10px] uppercase">Contacts SMS Broadcast</span>
                                </div>
                                <span className={`text-[9px] font-bold uppercase ${sosDispatched ? "text-emerald-400" : "text-amber-400"}`}>
                                  {sosDispatched ? "Sent" : "Queued"}
                                </span>
                              </div>

                              {/* Audio recording */}
                              <div className={`flex items-center justify-between ${styles.textMain}`}>
                                <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  <span className="text-[10px] uppercase">Ambient Mic recording</span>
                                </div>
                                <span className="text-[9px] font-bold text-emerald-400 uppercase">Stream On</span>
                              </div>

                              {/* CrowdShield */}
                              <div className={`flex items-center justify-between ${styles.textMain}`}>
                                <div className="flex items-center gap-2">
                                  <span className={`w-1.5 h-1.5 rounded-full ${crowdShieldEnabled ? "bg-emerald-400" : "bg-zinc-600"}`}></span>
                                  <span className="text-[10px] uppercase">CrowdShield Mesh</span>
                                </div>
                                <span className={`text-[9px] font-bold uppercase ${crowdShieldEnabled ? "text-emerald-400 animate-pulse" : "text-zinc-500"}`}>
                                  {crowdShieldEnabled ? "Broadcasting" : "Offline"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Cancellation Input Box */}
                          <div className={`rounded-[24px] p-5 flex flex-col gap-3 shadow-sm ${styles.cardBg}`}>
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${styles.textStrong}`}>Disarm Threat Beacon</span>
                              <span className={`text-[9px] font-mono uppercase tracking-wider ${styles.textMuted}`}>Pin Required</span>
                            </div>
                            
                            <div className="flex gap-2">
                              <input
                                id="input-disarm-pin"
                                type="password"
                                value={pinInput}
                                onChange={(e) => setPinInput(e.target.value)}
                                placeholder="Security Pin (1234)"
                                className={`flex-1 rounded-xl p-2.5 text-xs font-mono text-center tracking-widest focus:outline-none focus:border-[#FF3B30] transition-colors ${styles.selectBg}`}
                              />
                              <button
                                id="btn-cancel-sos"
                                onClick={cancelSOSAlert}
                                className="px-5 py-2.5 bg-[#FF3B30] hover:bg-[#D32F2F] text-white text-xs font-mono uppercase tracking-wider font-bold rounded-xl transition-all shadow-md shadow-red-600/10"
                              >
                                disarm
                              </button>
                            </div>
                            {pinError && <p className="text-[10px] text-red-400 font-mono uppercase tracking-wider">{pinError}</p>}
                          </div>

                        </motion.div>
                      )}

                      {/* T3: CROWDSHIELD RADAR MAP */}
                      {activeTab === "crowdshield" && (
                        <motion.div
                          key="tab-crowdshield"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.22, ease: "easeInOut" }}
                          id="tab-crowdshield"
                          className="flex flex-col gap-4"
                        >
                                     <div className={`p-4 rounded-[20px] flex items-center justify-between shadow-sm border ${styles.cardBg}`}>
                            <div className="flex items-center gap-2.5">
                              <Compass className="w-5 h-5 text-[#FF3B30] animate-spin" style={{ animationDuration: "12s" }} />
                              <div>
                                <h3 className={`text-xs font-bold uppercase font-mono tracking-wider ${styles.textStrong}`}>CrowdShield Radar</h3>
                                <p className={`text-[9px] font-mono uppercase tracking-wider ${styles.textMuted}`}>Real-time local safety mesh network</p>
                              </div>
                            </div>
                            <span className="text-[9px] font-mono bg-red-950/40 text-[#FF3B30] border border-red-900/50 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                              Scanner active
                            </span>
                          </div>

                          {/* Radar Scan Grid map simulator */}
                          <div className={`rounded-[24px] py-6 flex flex-col items-center justify-center relative overflow-hidden shadow-inner transition-colors duration-300 ${styles.innerBg}`}>
                            <span className={`absolute top-2 left-3 text-[9px] font-mono uppercase tracking-wider ${styles.textMuted}`}>200m Coverage Circle</span>
                            
                            <div className="relative w-48 h-48 flex items-center justify-center">
                              {/* Sweeping radar line */}
                              <motion.div 
                                className="absolute w-24 h-[1px] bg-linear-to-r from-[#FF3B30] to-transparent origin-left left-1/2"
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                                style={{ transformOrigin: "left center" }}
                              />

                              {/* Concentric rings */}
                              <div className={`absolute w-44 h-44 rounded-full border flex items-center justify-center transition-colors ${isDark ? "border-zinc-900" : "border-slate-200"}`}>
                                <div className={`absolute w-32 h-32 rounded-full border flex items-center justify-center transition-colors ${isDark ? "border-zinc-900" : "border-slate-200"}`}>
                                  <div className={`w-20 h-20 rounded-full border flex items-center justify-center transition-colors ${isDark ? "border-zinc-900" : "border-slate-200"}`}>
                                    <div className={`w-8 h-8 rounded-full border bg-red-950/20 flex items-center justify-center transition-colors ${isDark ? "border-zinc-800" : "border-slate-300"}`}>
                                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B30] animate-pulse"></span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Responder Blips */}
                              {responders.map((r) => {
                                // Calculate simple positions based on distance and bearing
                                const rad = (r.bearingDeg * Math.PI) / 180;
                                const distanceScale = (r.distanceM / 200) * 88; // max radius 88px
                                const x = Math.sin(rad) * distanceScale;
                                const y = -Math.cos(rad) * distanceScale;

                                return (
                                  <motion.div
                                    key={r.id}
                                    className="absolute"
                                    style={{ left: `calc(50% + ${x}px - 6px)`, top: `calc(50% + ${y}px - 6px)` }}
                                    animate={r.isMovingTowardsMe ? { scale: [1, 1.3, 1] } : {}}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                  >
                                    <div className={`w-3.5 h-3.5 rounded-full ${r.role === "Securitas Agent" ? "bg-amber-400" : "bg-emerald-400"} flex items-center justify-center shadow-lg relative`}>
                                      <UserCheck className={`w-2 h-2 ${isDark ? "text-zinc-950" : "text-white"}`} />
                                      <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-zinc-950"></span>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>

                            <span className={`text-[9px] font-mono mt-3 uppercase tracking-wider ${styles.textMuted}`}>Anonymized GPS Encrypted Shield Active</span>
                          </div>

                          {/* Responders list */}
                          <div className="flex flex-col gap-2">
                            <span className={`text-[9px] font-mono uppercase tracking-wider block ${styles.textMuted}`}>Nearby Guardians within 200m:</span>
                            
                            <div className="flex flex-col gap-2">
                              {responders.map((r) => (
                                <div key={r.id} className={`p-3 rounded-xl flex items-center justify-between text-xs font-mono shadow-sm transition-colors duration-300 ${styles.cardBg}`}>
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${r.role === "Securitas Agent" ? "bg-amber-400" : "bg-emerald-400"}`}></span>
                                    <div className="flex flex-col">
                                      <span className={`font-semibold text-[11px] font-sans ${styles.textStrong}`}>{r.name}</span>
                                      <span className={`text-[9px] uppercase tracking-wider ${styles.textMuted}`}>{r.role}</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className={`font-bold block ${styles.textStrong}`}>{r.distanceM}m</span>
                                    <span className={`text-[8px] font-normal uppercase tracking-wider ${styles.textMuted}`}>
                                      {r.isMovingTowardsMe ? "🚀 RESPONDING" : "Vigilant standby"}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <button
                            id="btn-radar-authorities"
                            onClick={() => activateSOSFlow("Immediate Manual Authorities Dial")}
                            className="w-full py-3 bg-[#FF3B30]/10 hover:bg-[#FF3B30]/25 border border-[#FF3B30]/35 text-[#FF3B30] rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 mt-2 uppercase tracking-wider"
                          >
                            <AlertTriangle className="w-4 h-4" /> Bypass Radar: Dial Local Police Directly
                          </button>

                        </motion.div>
                      )}

                      {/* T4: EMERGENCY CONTACTS SETUP */}
                      {activeTab === "contacts" && (
                        <motion.div
                          key="tab-contacts"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.22, ease: "easeInOut" }}
                          id="tab-contacts"
                          className="flex flex-col gap-4"
                        >
                                  <div className={`p-4 rounded-[20px] flex items-center gap-3 shadow-sm border ${styles.cardBg}`}>
                            <Users className="w-5 h-5 text-[#FF3B30]" />
                            <div>
                              <h3 className={`text-xs font-bold uppercase font-mono tracking-wider ${styles.textStrong}`}>Emergency Contacts</h3>
                              <p className={`text-[9px] font-mono uppercase tracking-wider ${styles.textMuted}`}>Up to 5 prioritized security guardians</p>
                            </div>
                          </div>

                          {/* List of current contacts */}
                          <div className="flex flex-col gap-2">
                            <AnimatePresence initial={false}>
                              {contacts.map((c, index) => (
                                <motion.div 
                                  key={c.id} 
                                  layout
                                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                  className={`p-4 rounded-[20px] flex items-center justify-between text-xs shadow-sm border transition-colors duration-300 ${styles.cardBg}`}
                                >
                                  <div className="flex items-center gap-3">
                                    {/* Priority tag */}
                                    <div className="flex flex-col items-center">
                                      <button 
                                        onClick={() => shiftPriority(index, "up")}
                                        className={`hover:text-[#FF3B30] p-0.5 transition-colors ${styles.textMuted}`}
                                        disabled={index === 0}
                                      >
                                        <ArrowUp className="w-3.5 h-3.5" />
                                      </button>
                                      <span className={`w-5 h-5 border text-[10px] font-mono font-bold flex items-center justify-center rounded transition-colors ${
                                        isDark ? "bg-[#050505] border-[#222] text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                                      }`}>
                                        {c.priority}
                                      </span>
                                      <button 
                                        onClick={() => shiftPriority(index, "down")}
                                        className={`hover:text-[#FF3B30] p-0.5 transition-colors ${styles.textMuted}`}
                                        disabled={index === contacts.length - 1}
                                      >
                                        <ArrowDown className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className={`font-semibold font-sans ${styles.textStrong}`}>{c.name}</span>
                                        {c.isAuthority && (
                                          <span className="text-[8px] bg-red-950 text-[#FF3B30] px-1.5 py-0.5 border border-red-900 rounded font-mono font-bold uppercase shrink-0">
                                            911 Direct
                                          </span>
                                        )}
                                      </div>
                                      <p className={`text-[10px] font-mono mt-0.5 ${styles.textSec}`}>{c.phone}</p>
                                      <p className={`text-[10px] italic ${styles.textMuted}`}>{c.relationship}</p>
                                    </div>
                                  </div>

                                   <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-end gap-1 font-mono text-right shrink-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="relative flex h-1.5 w-1.5">
                                          {c.safetyStatus === "safe" ? (
                                            <>
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                            </>
                                          ) : c.lastCheckIn === "Pinging device..." ? (
                                            <>
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                                            </>
                                          ) : (
                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-zinc-500"></span>
                                          )}
                                        </span>
                                        <span className={`text-[9px] uppercase font-bold tracking-wider ${
                                          c.safetyStatus === "safe" 
                                            ? "text-emerald-400" 
                                            : c.lastCheckIn === "Pinging device..." 
                                            ? "text-amber-400 animate-pulse" 
                                            : "text-zinc-400"
                                        }`}>
                                          {c.safetyStatus === "safe" ? "SECURE" : c.lastCheckIn === "Pinging device..." ? "PINGING" : "UNCHECKED"}
                                        </span>
                                      </div>
                                      <span className={`text-[8px] uppercase tracking-wide block ${styles.textMuted}`}>
                                        Check-in: {c.lastCheckIn || "Never"}
                                      </span>
                                    </div>

                                    {/* Interactive Ping/Verify Action Button */}
                                    <button
                                      onClick={() => handlePingContact(c.id)}
                                      disabled={c.lastCheckIn === "Pinging device..."}
                                      className={`px-2.5 py-1 rounded-lg border text-[9px] font-mono uppercase tracking-wider font-bold transition-all flex items-center gap-1 ${
                                        c.lastCheckIn === "Pinging device..."
                                          ? "opacity-60 cursor-not-allowed border-zinc-700 bg-transparent text-zinc-400"
                                          : isDark
                                          ? "border-zinc-800 bg-[#1A1A1A] hover:bg-zinc-800 text-zinc-300 hover:border-[#FF3B30]/50"
                                          : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:border-slate-300 shadow-xs"
                                      }`}
                                      title="Request Live Safety Check-in Handshake"
                                    >
                                      Ping
                                    </button>

                                    <button
                                      onClick={() => handleRemoveContact(c.id)}
                                      className={`p-2 hover:text-[#FF3B30] rounded-lg transition-all ${isDark ? "text-zinc-500 hover:bg-red-950/20" : "text-slate-400 hover:bg-red-50"}`}
                                      title="Delete Contact"
                                    >
                                      <Trash className="w-4 h-4" />
                                    </button>
                                  </div>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>

                          {/* Add Contact Form */}
                          <form onSubmit={handleAddContact} className={`p-5 rounded-[24px] flex flex-col gap-4 shadow-sm border transition-colors duration-300 ${styles.cardBg}`}>
                            <span className={`text-xs font-semibold uppercase tracking-wider font-mono ${styles.textStrong}`}>Add Priority Guardian</span>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <input
                                id="input-contact-name"
                                type="text"
                                placeholder="Full Name"
                                value={newContactName}
                                onChange={(e) => setNewContactName(e.target.value)}
                                className={`border rounded-xl p-2.5 focus:outline-none focus:border-[#FF3B30] transition-colors ${styles.selectBg}`}
                                required
                              />
                              <input
                                id="input-contact-phone"
                                type="text"
                                placeholder="Phone number"
                                value={newContactPhone}
                                onChange={(e) => setNewContactPhone(e.target.value)}
                                className={`border rounded-xl p-2.5 font-mono focus:outline-none focus:border-[#FF3B30] transition-colors ${styles.selectBg}`}
                                required
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <input
                                id="input-contact-relation"
                                type="text"
                                placeholder="Relation (e.g. Spouse)"
                                value={newContactRelationship}
                                onChange={(e) => setNewContactRelationship(e.target.value)}
                                className={`border rounded-xl p-2.5 focus:outline-none focus:border-[#FF3B30] transition-colors ${styles.selectBg}`}
                              />
                              <div className={`flex items-center gap-2 border rounded-xl px-2.5 ${styles.selectBg}`}>
                                <input
                                  id="checkbox-contact-authority"
                                  type="checkbox"
                                  checked={newContactIsAuthority}
                                  onChange={(e) => setNewContactIsAuthority(e.target.checked)}
                                  className="rounded text-[#FF3B30] bg-transparent border-slate-300"
                                />
                                <label className={`text-[10px] select-none uppercase font-mono tracking-wider ${styles.textMuted}`}>Authority / 911</label>
                              </div>
                            </div>

                            <button
                              id="btn-add-contact"
                              type="submit"
                              disabled={contacts.length >= 5}
                              className="w-full py-2.5 bg-[#FF3B30] hover:bg-[#D32F2F] disabled:opacity-40 text-white rounded-xl text-xs font-mono uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/10"
                            >
                              <Plus className="w-4 h-4" /> Save Contact ({contacts.length}/5)
                            </button>
                          </form>

                          {/* Default SMS broadcast template customization */}
                          <div className={`p-5 rounded-[24px] flex flex-col gap-3 shadow-sm border transition-colors duration-300 ${styles.cardBg}`}>
                            <span className={`text-xs font-semibold uppercase tracking-wider font-mono ${styles.textStrong}`}>SOS Broadcast SMS Template:</span>
                            <textarea
                              id="textarea-sms-template"
                              className={`w-full h-20 border rounded-xl p-3 text-xs font-sans focus:outline-none focus:border-[#FF3B30] transition-colors ${styles.selectBg}`}
                              defaultValue="[GUARDIANHALO EMERGENCY ALERT] Squeeze distress code activated from my IoT Safety Ring. My coordinates lock: lat 37.7749, lng -122.4194. Live trail tracking link: app.guardianhalo.io/sos-feed."
                            />
                            <p className={`text-[9px] leading-relaxed font-mono uppercase tracking-wider ${styles.textMuted}`}>
                              *GPS coordinates are updated dynamically and injected automatically in case of active distress pattern squeeze.
                            </p>
                          </div>

                        </motion.div>
                      )}

                      {/* T5: EVIDENCE VAULT */}
                      {activeTab === "vault" && (
                        <motion.div
                          key="tab-vault"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.22, ease: "easeInOut" }}
                          id="tab-vault"
                          className="flex flex-col gap-4"
                        >
                                  <div className={`p-4 rounded-[20px] flex items-center gap-3 shadow-sm border transition-colors duration-300 ${styles.cardBg}`}>
                            <Database className="w-5 h-5 text-[#FF3B30]" />
                            <div>
                              <h3 className={`text-xs font-bold uppercase font-mono tracking-wider ${styles.textStrong}`}>Evidence Vault</h3>
                              <p className={`text-[9px] font-mono uppercase tracking-wider ${styles.textMuted}`}>Encrypted audio snippets &amp; tamper logs</p>
                            </div>
                          </div>

                          {/* Incidents list */}
                          <div className="flex flex-col gap-3">
                            <AnimatePresence initial={false}>
                              {incidents.map((inc) => (
                                <motion.div 
                                  key={inc.id} 
                                  layout
                                  initial={{ opacity: 0, scale: 0.98, y: 15 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.98, y: -15 }}
                                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                                  className={`rounded-[24px] p-5 flex flex-col gap-4 relative overflow-hidden shadow-sm border transition-colors duration-300 ${styles.cardBg}`}
                                >
                                
                                <div className={`flex items-center justify-between border-b pb-2 ${styles.divider}`}>
                                  <div className="flex items-center gap-2 font-mono text-[10.5px]">
                                    <span className="text-[#FF3B30] font-bold">{inc.id}</span>
                                    <span className={`font-bold ${styles.textMuted}`}>•</span>
                                    <span className={styles.textSec}>{new Date(inc.timestamp).toLocaleDateString()}</span>
                                  </div>
                                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                                    inc.status === "EMERGENCY" 
                                      ? "bg-red-950/40 text-[#FF3B30] border border-red-900/60" 
                                      : "bg-amber-950/40 text-amber-500 border border-amber-900/60"
                                  }`}>
                                    {inc.status}
                                  </span>
                                </div>

                                <div className="text-xs flex flex-col gap-1.5">
                                  <div className={`font-mono text-[9px] uppercase tracking-wider ${styles.textMuted}`}>Vocal Transcription Track:</div>
                                  <p className={`italic font-medium p-3 rounded-xl border leading-relaxed ${
                                    isDark ? "text-zinc-200 bg-[#050505] border-[#222]" : "text-slate-800 bg-slate-50 border-slate-200"
                                  }`}>
                                    "{inc.transcript}"
                                  </p>
                                </div>

                                <div className={`grid grid-cols-2 gap-3 text-[10.5px] font-mono ${styles.textSec}`}>
                                  <div>
                                    <span className={`text-[9px] uppercase tracking-wider block ${styles.textMuted}`}>Risk Score Index:</span>
                                    <span className={`font-bold ${styles.textStrong}`}>{inc.riskScore}/100</span>
                                  </div>
                                  <div>
                                    <span className={`text-[9px] uppercase tracking-wider block ${styles.textMuted}`}>Assigned Threat:</span>
                                    <span className={`font-bold uppercase ${styles.textStrong}`}>{inc.threatType}</span>
                                  </div>
                                </div>

                                {/* Blockchain Seal certification representation */}
                                {inc.isBlockchainCertified && (
                                  <div className={`p-3 rounded-xl border flex flex-col gap-1 font-mono text-[9px] uppercase tracking-wider ${
                                    isDark ? "bg-[#050505] border-[#222]" : "bg-slate-50 border-slate-200"
                                  }`}>
                                    <div className="flex items-center justify-between text-emerald-400 font-bold">
                                      <span className="flex items-center gap-1">
                                        <Lock className="w-3 h-3 text-emerald-400" /> Blockchain Evidence Seal Certified
                                      </span>
                                      <span>HASH OK</span>
                                    </div>
                                    <div className={`truncate font-mono text-[8.5px] lowercase ${styles.textMuted}`} title={inc.blockHash}>
                                      Block Signature: {inc.blockHash}
                                    </div>
                                  </div>
                                )}

                                {/* Detailed Guardian AI Analysis review (Gemini Powered) */}
                                {inc.aiDetailedAssessment ? (
                                  <div className={`border p-4 rounded-xl text-xs flex flex-col gap-2 ${
                                    isDark ? "bg-red-950/10 border-red-900/30 text-zinc-350" : "bg-red-50/50 border-red-100 text-slate-800"
                                  }`}>
                                    <span className="font-semibold text-[#FF3B30] flex items-center gap-1 text-[11px] uppercase font-mono tracking-wider">
                                      <Sparkles className="w-3.5 h-3.5 text-[#FF3B30] animate-pulse" /> Guardian AI Incident Audit
                                    </span>
                                    <p className="leading-relaxed text-[11px] font-sans">
                                      {inc.aiDetailedAssessment}
                                    </p>
                                    {inc.safetyInstructions && inc.safetyInstructions.length > 0 && (
                                      <div className={`mt-1 flex flex-col gap-1 text-[10px] ${styles.textMuted}`}>
                                        <span className={`font-mono text-[9px] uppercase tracking-wider ${styles.textMuted}`}>Legal/Precautionary Advice:</span>
                                        {inc.safetyInstructions.map((inst, i) => (
                                          <div key={i} className="flex gap-1.5">
                                            <span className="text-[#FF3B30]">•</span>
                                            <span className={styles.textSec}>{inst}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => analyzeEvidenceWithGemini(inc)}
                                    className="w-full py-2.5 bg-[#FF3B30] hover:bg-[#D32F2F] text-white rounded-xl text-xs font-mono uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-red-600/10"
                                  >
                                    <Sparkles className="w-4 h-4 text-white animate-pulse" /> Process Incident with Guardian AI
                                  </button>
                                )}

                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>

                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>

                    {/* Smartphone Lower App Navigation Bar */}
                    <nav id="companion-app-nav" className={`border-t px-4 py-4 flex items-center justify-around z-40 select-none transition-colors duration-300 ${styles.divider} ${styles.cardBg}`}>
                      <button
                        id="nav-btn-dashboard"
                        onClick={() => {
                          if (sosActive) {
                            setActiveTab("alert");
                          } else {
                            setActiveTab("dashboard");
                          }
                        }}
                        className={`relative flex flex-col items-center gap-1 pb-1 transition-all ${
                          activeTab === "dashboard" || activeTab === "alert" ? "text-[#FF3B30]" : isDark ? "text-zinc-500 hover:text-zinc-200" : "text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        <Smartphone className="w-4.5 h-4.5" />
                        <span className="text-[9px] font-mono uppercase tracking-wider">Halo App</span>
                        {(activeTab === "dashboard" || activeTab === "alert") && (
                          <motion.span 
                            layoutId="active-tab-dot"
                            className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-[#FF3B30] shadow-md shadow-red-600/50"
                            transition={{ type: "spring", stiffness: 380, damping: 28 }}
                          />
                        )}
                      </button>

                      <button
                        id="nav-btn-crowdshield"
                        onClick={() => setActiveTab("crowdshield")}
                        className={`relative flex flex-col items-center gap-1 pb-1 transition-all ${
                          activeTab === "crowdshield" ? "text-[#FF3B30]" : isDark ? "text-zinc-500 hover:text-zinc-200" : "text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        <Compass className="w-4.5 h-4.5" />
                        <span className="text-[9px] font-mono uppercase tracking-wider">Radar</span>
                        {activeTab === "crowdshield" && (
                          <motion.span 
                            layoutId="active-tab-dot"
                            className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-[#FF3B30] shadow-md shadow-red-600/50"
                            transition={{ type: "spring", stiffness: 380, damping: 28 }}
                          />
                        )}
                      </button>

                      <button
                        id="nav-btn-contacts"
                        onClick={() => setActiveTab("contacts")}
                        className={`relative flex flex-col items-center gap-1 pb-1 transition-all ${
                          activeTab === "contacts" ? "text-[#FF3B30]" : isDark ? "text-zinc-500 hover:text-zinc-200" : "text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        <Users className="w-4.5 h-4.5" />
                        <span className="text-[9px] font-mono uppercase tracking-wider">Contacts</span>
                        {activeTab === "contacts" && (
                          <motion.span 
                            layoutId="active-tab-dot"
                            className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-[#FF3B30] shadow-md shadow-red-600/50"
                            transition={{ type: "spring", stiffness: 380, damping: 28 }}
                          />
                        )}
                      </button>

                      <button
                        id="nav-btn-vault"
                        onClick={() => setActiveTab("vault")}
                        className={`relative flex flex-col items-center gap-1 pb-1 transition-all ${
                          activeTab === "vault" ? "text-[#FF3B30]" : isDark ? "text-zinc-500 hover:text-zinc-200" : "text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        <Database className="w-4.5 h-4.5" />
                        <span className="text-[9px] font-mono uppercase tracking-wider">Vault</span>
                        {activeTab === "vault" && (
                          <motion.span 
                            layoutId="active-tab-dot"
                            className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-[#FF3B30] shadow-md shadow-red-600/50"
                            transition={{ type: "spring", stiffness: 380, damping: 28 }}
                          />
                        )}
                      </button>
                    </nav>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* SmartPhone Home indicator pill bar */}
            <div className={`h-6 flex items-center justify-center select-none pb-1 shrink-0 transition-colors duration-300 ${styles.innerBg}`}>
              <div className={`w-28 h-1 rounded-full transition-colors ${isDark ? "bg-zinc-800" : "bg-slate-300"}`}></div>
            </div>

          </motion.div>
        </section>

        </div>
      </motion.div>
    )}
  </AnimatePresence>
</main>

      {/* FOOTER METRICS INFO */}
      <footer id="app-footer" className={`border-t transition-colors duration-300 ${styles.divider} ${styles.innerBg}`}>
        <div className={`max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-wider ${styles.textMuted}`}>
          <span>GuardianHalo SmartRing Companion Suite (v1.0.4)</span>
          <div className={`flex items-center gap-4 ${styles.textSec}`}>
            <span>BLE Relay Latency: <strong className="text-emerald-400 font-mono font-bold">&lt; 1.2s</strong></span>
            <span>Failure Rate: <strong className="text-emerald-400 font-mono font-bold">0%</strong></span>
            <span>Threat Accuracy: <strong className="text-emerald-400 font-mono font-bold">97.4%</strong></span>
          </div>
        </div>
        <div className={`border-t ${styles.divider} max-w-7xl mx-auto px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-2 text-[10px] normal-case tracking-normal ${styles.textMuted}`}>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full border border-[#FF3B30] inline-block" />
            Conceptual hackathon prototype — not a certified medical, legal, or emergency dispatch device.
          </span>
          <span>&copy; {new Date().getFullYear()} GuardianHalo</span>
        </div>
      </footer>
    </div>
  );
}
