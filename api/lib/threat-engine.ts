import { GoogleGenAI } from "@google/genai";

/**
 * Shared "brain" for GuardianHalo's two backend endpoints:
 *   - analyzeThreat()  -> powers /api/analyze-threat
 *   - dispatchAlert()  -> powers /api/trigger-alert
 *
 * This file is intentionally framework-agnostic (no Express, no
 * Vercel-specific types) so it can be imported by:
 *   1. server.ts            (Express, used for local `npm run dev`)
 *   2. api/analyze-threat.ts (Vercel serverless function, used in production)
 *   3. api/trigger-alert.ts  (Vercel serverless function, used in production)
 *
 * Keeping the logic in one place means local dev and the deployed
 * Vercel app can never drift apart or behave differently.
 */

export interface ThreatAnalysisResult {
  success: boolean;
  aiProcessed: boolean;
  data: {
    riskScore: number;
    status: "SAFE" | "LOW_THREAT" | "HIGH_THREAT" | "EMERGENCY";
    confidence: number;
    threatType: string;
    keyKeywords: string[];
    briefAssessment: string;
    autoTriggerSOS: boolean;
    safetyInstructions: string[];
  };
}

export interface AlertContact {
  name?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface AlertDispatchResult {
  success: boolean;
  message: string;
  sosID: string;
  dispatchedAt: string;
  broadcastRadiusM: number;
  authorityNotified: boolean;
  smsReceipts: { name: string; phone: string; status: string; timestamp: string }[];
}

// Lazy-loaded GoogleGenAI Client (re-used across warm serverless invocations)
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    console.warn("GEMINI_API_KEY is not configured or holds a placeholder. Falling back to Mock Threat AI Engine.");
    return null;
  }

  if (!aiClient) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (err) {
      console.error("Error initializing GoogleGenAI client:", err);
      return null;
    }
  }
  return aiClient;
}

/**
 * 1. Environmental Threat AI Analyzer
 * Tries live Gemini analysis first; falls back to a fast, deterministic
 * offline keyword-scoring engine if no API key is configured or the
 * live call fails for any reason. The offline engine ALSO guarantees the
 * simulator and Evidence Vault always feel alive, even with zero setup.
 */
export async function analyzeThreat(
  transcript: string,
  audioSnippetLengthSec: number | undefined,
  simulatedAudio: boolean | undefined
): Promise<ThreatAnalysisResult> {
  const ai = getGeminiClient();

  // Real Gemini Path
  if (ai) {
    try {
      const prompt = `
        You are the environmental safety brain of GuardianHalo, a smart IoT personal security ring.
        Analyze the following text transcribed from a continuous audio recording in a potentially dangerous situation.

        Transcript: "${transcript}"
        Audio Snippet Context: ${audioSnippetLengthSec || 5} seconds duration, ${simulatedAudio ? "Screaming/high-decibel context simulated" : "Regular decibel level"}.

        Evaluate this transcript for physical danger, aggressive confrontation, kidnapping risks, assault indicators, or verbal abuse.
        Provide a JSON response with the following fields:
        - riskScore: integer between 0 and 100 (where 0 is completely safe and 100 is life-threatening emergency).
        - status: string, either "SAFE", "LOW_THREAT", "HIGH_THREAT", or "EMERGENCY".
        - confidence: number between 0 and 1.
        - threatType: string (e.g. "Stalking", "Aggressive Confrontation", "Domestic Conflict", "None", etc.).
        - keyKeywords: array of strings containing triggering words/phrases (e.g. "let go", "help", "stop", "police").
        - briefAssessment: string (short, highly empathetic 1-sentence evaluation of the danger).
        - autoTriggerSOS: boolean (true if riskScore >= 80, suggesting the mobile app should immediately activate the SOS flow without waiting for the user to squeeze).
        - safetyInstructions: array of strings (3 bullet points of quick safety advice for the user based on the scenario).

        Format your answer STRICTLY as a valid JSON object. Do not wrap in markdown blocks like \`\`\`json.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const responseText = response.text || "{}";
      try {
        const parsed = JSON.parse(responseText.trim());
        return {
          success: true,
          aiProcessed: true,
          data: parsed,
        };
      } catch (parseErr) {
        console.error("Failed to parse Gemini JSON, falling back to mock parser", parseErr, responseText);
        // Fall through to offline engine below
      }
    } catch (apiErr: any) {
      console.error("Gemini API Error:", apiErr);
      // Fall through to offline engine below
    }
  }

  // Offline Mock Safety AI Engine (deterministic, fast, always available)
  const textUpper = transcript.toUpperCase();
  let riskScore = 15;
  let threatType = "None";
  let status: ThreatAnalysisResult["data"]["status"] = "SAFE";
  const keywordsFound: string[] = [];
  let briefAssessment = "No active threats detected in your surroundings.";
  let autoTriggerSOS = false;
  let safetyInstructions = [
    "Keep your ring calibrated and within easy thumb-squeeze reach.",
    "Be aware of your immediate path and look for well-lit public zones.",
    "Ensure your CrowdShield mode is activated for community safety backup.",
  ];

  const dangerKeywords = [
    { word: "HELP", weight: 35, type: "Distress / Call for assistance" },
    { word: "STOP", weight: 25, type: "Confrontation / Boundary setting" },
    { word: "POLICE", weight: 30, type: "Urgent emergency request" },
    { word: "LET GO", weight: 45, type: "Physical grab / Assault indicator" },
    { word: "GET AWAY", weight: 35, type: "Harassment / Pursuit" },
    { word: "DON'T TOUCH", weight: 45, type: "Physical boundaries breached" },
    { word: "NO NO NO", weight: 40, type: "Panic / Defense mechanism" },
    { word: "KILL", weight: 60, type: "Lethal threat / Verbal weapon" },
    { word: "STALKING", weight: 25, type: "Harassment" },
    { word: "FOLLOWING ME", weight: 35, type: "Active pursuit / Stalking" },
    { word: "ATTACK", weight: 55, type: "Active physical threat" },
    { word: "SCREAM", weight: 30, type: "Panic" },
  ];

  dangerKeywords.forEach((k) => {
    if (textUpper.includes(k.word)) {
      keywordsFound.push(k.word.toLowerCase());
      riskScore += k.weight;
      threatType = k.type;
    }
  });

  if (simulatedAudio) {
    riskScore += 15; // Decibel threat addition
  }

  // Cap risk score at 100
  riskScore = Math.min(riskScore, 100);

  if (riskScore >= 80) {
    status = "EMERGENCY";
    autoTriggerSOS = true;
    briefAssessment = "Critical safety threat detected: physical containment or severe verbal assault indicators.";
    safetyInstructions = [
      "GuardianHalo is preparing to auto-trigger CrowdShield and emergency dispatch.",
      "Stay calm, make loud noise, or seek immediate shelter in a crowded public business.",
      "A 15-second audio evidence clip is being safely encrypted and securely streamed to the cloud.",
    ];
  } else if (riskScore >= 50) {
    status = "HIGH_THREAT";
    briefAssessment = "Elevated threat detected: ongoing harassment, stalking indicators, or loud shouting.";
    safetyInstructions = [
      "Keep your finger on the ring sensor, ready for a silent squeeze pattern.",
      "Head towards the nearest bright, busy store, train station, or gas station.",
      "GuardianHalo is on High Alert: voice trigger threshold lowered.",
    ];
  } else if (riskScore >= 25) {
    status = "LOW_THREAT";
    briefAssessment = "Mild situational distress: potential verbal boundary crossing.";
    safetyInstructions = [
      "Keep a steady walking pace. Avoid pausing near dark alcoves.",
      "Keep the GuardianHalo pairing active in your hand.",
      "If you feel uncomfortable, squeeze the ring to broadcast a live path to contacts.",
    ];
  }

  return {
    success: true,
    aiProcessed: false,
    data: {
      riskScore,
      status,
      confidence: 0.92,
      threatType,
      keyKeywords: keywordsFound,
      briefAssessment,
      autoTriggerSOS,
      safetyInstructions,
    },
  };
}

/**
 * 2. Emergency SOS Dispatcher
 * Simulated broadcast to priority contacts + local authorities.
 */
export function dispatchAlert(
  contacts: AlertContact[] | undefined,
  location: { lat?: number; lng?: number } | undefined,
  triggerMethod: string | undefined,
  timestamp: string | undefined
): AlertDispatchResult {
  console.log(`[GuardianHalo SOS Alert] Triggered at ${timestamp || new Date().toISOString()}`);
  console.log(`- Trigger Source: ${triggerMethod || "Squeeze Pattern (3 Short + 1 Long)"}`);
  console.log(`- Location coordinates: Lat ${location?.lat ?? "37.7749"}, Lng ${location?.lng ?? "-122.4194"}`);
  console.log(`- Dispatched SMS notifications to:`, contacts || ["All Priority Contacts"]);

  return {
    success: true,
    message: "SOS alert dispatched successfully.",
    sosID: "SOS-" + Math.floor(100000 + Math.random() * 900000),
    dispatchedAt: new Date().toISOString(),
    broadcastRadiusM: 200,
    authorityNotified: true,
    smsReceipts: (contacts || []).map((c) => ({
      name: typeof c === "string" ? c : c.name || "Unknown",
      phone: typeof c === "string" ? "Simulated Phone" : c.phone || "Simulated Phone",
      status: "Delivered",
      timestamp: new Date().toISOString(),
    })),
  };
}
