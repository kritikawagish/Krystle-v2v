import { GoogleGenAI } from "@google/genai";
import twilio from "twilio";

/**
 * Shared backend logic for GuardianHalo's API routes:
 *   - analyzeThreat() -> powers POST /api/analyze-threat
 *   - dispatchAlert() -> powers POST /api/trigger-alert
 *
 * Important security rule:
 * API keys are read from process.env on the backend only. Do not place Gemini,
 * Twilio, Supabase, or other secret keys inside src/App.tsx or any frontend file.
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

// Lazy-loaded GoogleGenAI client, reused across warm serverless invocations.
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    console.warn("GEMINI_API_KEY is not configured. Falling back to local keyword threat engine.");
    return null;
  }

  if (!aiClient) {
    try {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "guardianhalo-v2v",
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

function normalizeGeminiThreatResult(raw: any): ThreatAnalysisResult["data"] {
  const riskScore = Math.max(0, Math.min(100, Number(raw?.riskScore ?? 15)));

  const allowedStatuses = ["SAFE", "LOW_THREAT", "HIGH_THREAT", "EMERGENCY"] as const;
  const rawStatus = String(raw?.status || "SAFE").toUpperCase();
  const status = allowedStatuses.includes(rawStatus as any)
    ? (rawStatus as ThreatAnalysisResult["data"]["status"])
    : riskScore >= 80
    ? "EMERGENCY"
    : riskScore >= 50
    ? "HIGH_THREAT"
    : riskScore >= 25
    ? "LOW_THREAT"
    : "SAFE";

  const keyKeywords = Array.isArray(raw?.keyKeywords)
    ? raw.keyKeywords.map((k: unknown) => String(k)).filter(Boolean).slice(0, 10)
    : [];

  const safetyInstructions = Array.isArray(raw?.safetyInstructions)
    ? raw.safetyInstructions.map((x: unknown) => String(x)).filter(Boolean).slice(0, 5)
    : [
        "Stay aware of your surroundings.",
        "Move toward a well-lit public area if you feel unsafe.",
        "Use the SOS button or squeeze pattern if the situation escalates.",
      ];

  return {
    riskScore,
    status,
    confidence: Math.max(0, Math.min(1, Number(raw?.confidence ?? 0.85))),
    threatType: String(raw?.threatType || "None"),
    keyKeywords,
    briefAssessment: String(raw?.briefAssessment || "No clear active threat detected."),
    autoTriggerSOS: Boolean(raw?.autoTriggerSOS ?? riskScore >= 80),
    safetyInstructions,
  };
}

/**
 * Environmental Threat AI Analyzer.
 *
 * Live path:
 *   Uses Gemini if GEMINI_API_KEY exists.
 *
 * Fallback path:
 *   Uses a local keyword scoring engine so the demo still works if Gemini is
 *   missing, quota-limited, or temporarily unavailable.
 */
export async function analyzeThreat(
  transcript: string,
  audioSnippetLengthSec: number | undefined,
  simulatedAudio: boolean | undefined
): Promise<ThreatAnalysisResult> {
  const ai = getGeminiClient();

  if (ai) {
    try {
      const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

      const prompt = `
You are the environmental safety brain of GuardianHalo, a smart IoT personal security ring.
Analyze the following text transcribed from a continuous audio recording in a potentially dangerous situation.

Transcript: "${transcript}"
Audio Snippet Context: ${audioSnippetLengthSec || 5} seconds duration, ${simulatedAudio ? "high-decibel / distress context" : "regular decibel context"}.

Evaluate this transcript for physical danger, aggressive confrontation, kidnapping risks, stalking, assault indicators, or verbal abuse.

Return STRICT JSON only with these fields:
{
  "riskScore": number from 0 to 100,
  "status": "SAFE" | "LOW_THREAT" | "HIGH_THREAT" | "EMERGENCY",
  "confidence": number from 0 to 1,
  "threatType": string,
  "keyKeywords": string[],
  "briefAssessment": string,
  "autoTriggerSOS": boolean,
  "safetyInstructions": string[]
}

Rules:
- autoTriggerSOS should be true only when riskScore >= 80.
- Keep briefAssessment to one short sentence.
- safetyInstructions should contain 3 practical short items.
- Do not include markdown fences.
`;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const responseText = response.text || "{}";
      const parsed = JSON.parse(responseText.trim());

      return {
        success: true,
        aiProcessed: true,
        data: normalizeGeminiThreatResult(parsed),
      };
    } catch (apiErr: any) {
      console.error("Gemini API error. Falling back to local threat engine:", apiErr);
    }
  }

  // Local fallback threat engine.
  const textUpper = transcript.toUpperCase();
  let riskScore = 15;
  let threatType = "None";
  let status: ThreatAnalysisResult["data"]["status"] = "SAFE";
  const keywordsFound: string[] = [];
  let briefAssessment = "No active threats detected in your surroundings.";
  let autoTriggerSOS = false;
  let safetyInstructions = [
    "Keep your ring calibrated and within easy thumb-squeeze reach.",
    "Stay aware of your immediate path and move toward well-lit public zones.",
    "Keep CrowdShield mode active for community safety backup.",
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
    riskScore += 15;
  }

  riskScore = Math.min(riskScore, 100);

  if (riskScore >= 80) {
    status = "EMERGENCY";
    autoTriggerSOS = true;
    briefAssessment = "Critical safety threat detected: physical containment or severe verbal assault indicators.";
    safetyInstructions = [
      "GuardianHalo is preparing to auto-trigger emergency contact alerts.",
      "Move toward a crowded, well-lit public place if possible.",
      "Make noise and keep the phone or wearable accessible if safe to do so.",
    ];
  } else if (riskScore >= 50) {
    status = "HIGH_THREAT";
    briefAssessment = "Elevated threat detected: possible harassment, stalking indicators, or loud confrontation.";
    safetyInstructions = [
      "Keep your finger ready on the ring sensor for a silent SOS squeeze.",
      "Head toward the nearest bright, busy store, station, or public area.",
      "GuardianHalo has lowered the voice-trigger threshold for faster escalation.",
    ];
  } else if (riskScore >= 25) {
    status = "LOW_THREAT";
    briefAssessment = "Mild situational distress detected: possible verbal boundary crossing.";
    safetyInstructions = [
      "Keep a steady walking pace and avoid isolated areas.",
      "Keep GuardianHalo connected and ready.",
      "If you feel uncomfortable, activate SOS to share your live location with contacts.",
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
 * Emergency SOS Dispatcher.
 *
 * Live path:
 *   Sends SMS through Twilio if TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and
 *   TWILIO_FROM_NUMBER are configured.
 *
 * Fallback path:
 *   Returns simulated receipts if Twilio is not configured so local development
 *   and Vercel demos do not crash.
 */
export async function dispatchAlert(
  contacts: AlertContact[] | undefined,
  location: { lat?: number; lng?: number } | undefined,
  triggerMethod: string | undefined,
  timestamp: string | undefined
): Promise<AlertDispatchResult> {
  const sosID = "SOS-" + Math.floor(100000 + Math.random() * 900000);
  const dispatchedAt = new Date().toISOString();
  const contactList = Array.isArray(contacts) ? contacts : [];

  const lat = typeof location?.lat === "number" ? location.lat : undefined;
  const lng = typeof location?.lng === "number" ? location.lng : undefined;
  const mapsLink = lat !== undefined && lng !== undefined
    ? `https://maps.google.com/?q=${lat},${lng}`
    : "Location unavailable";

  const messageBody = `[GUARDIANHALO EMERGENCY ALERT]\nSOS ID: ${sosID}\nTrigger: ${triggerMethod || "Unknown"}\nTime: ${timestamp || dispatchedAt}\nLocation: ${mapsLink}\n\nThis is an automated safety alert from GuardianHalo. Please check on me immediately.`;

  console.log(`[GuardianHalo SOS Alert] ${sosID}`);
  console.log(`- Trigger Source: ${triggerMethod || "Unknown"}`);
  console.log(`- Location: ${mapsLink}`);
  console.log(`- Contacts:`, contactList);

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (contactList.length === 0) {
    return {
      success: true,
      message: "No emergency contacts configured.",
      sosID,
      dispatchedAt,
      broadcastRadiusM: 200,
      authorityNotified: false,
      smsReceipts: [],
    };
  }

  if (!accountSid || !authToken || !fromNumber) {
    return {
      success: true,
      message: "Simulated SOS alert. Twilio environment variables are not configured.",
      sosID,
      dispatchedAt,
      broadcastRadiusM: 200,
      authorityNotified: false,
      smsReceipts: contactList.map((c) => ({
        name: c.name || "Unknown",
        phone: c.phone || "Unknown",
        status: "Simulated - Twilio not configured",
        timestamp: new Date().toISOString(),
      })),
    };
  }

  const client = twilio(accountSid, authToken);

  const smsReceipts = await Promise.all(
    contactList.map(async (contact) => {
      const name = contact.name || "Unknown";
      const phone = contact.phone || "";

      try {
        if (!phone.startsWith("+")) {
          return {
            name,
            phone: phone || "Missing phone",
            status: "Skipped - phone must use E.164 format, example +919876543210",
            timestamp: new Date().toISOString(),
          };
        }

        const sent = await client.messages.create({
          body: messageBody,
          from: fromNumber,
          to: phone,
        });

        return {
          name,
          phone,
          status: sent.status || "queued",
          timestamp: new Date().toISOString(),
        };
      } catch (err: any) {
        return {
          name,
          phone: phone || "Unknown",
          status: `Failed - ${err?.message || "Unknown Twilio error"}`,
          timestamp: new Date().toISOString(),
        };
      }
    })
  );

  return {
    success: true,
    message: "SOS alert dispatch attempted.",
    sosID,
    dispatchedAt,
    broadcastRadiusM: 200,
    authorityNotified: false,
    smsReceipts,
  };
}
