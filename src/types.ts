export enum RingColor {
  COSMIC_OBSIDIAN = "Cosmic Obsidian",
  AURELIA_GOLD = "Aurelia Gold",
  PLATINUM_SILVER = "Platinum Silver"
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  priority: number; // 1 to 5
  isAuthority: boolean; // Direct 911/Local Emergency authority tie-in
  lastCheckIn?: string; // e.g. "12 mins ago" or "Just now" or "Today, 08:30"
  safetyStatus?: "safe" | "unchecked" | "away"; // Dynamic status indicator
}

export interface NearbyResponder {
  id: string;
  name: string;
  distanceM: number;
  bearingDeg: number; // For rendering direction indicators (0 to 360)
  role: "Responder" | "Guardian Angel" | "Securitas Agent";
  isMovingTowardsMe: boolean;
}

export interface SecurityIncident {
  id: string;
  timestamp: string;
  durationSec: number;
  transcript: string;
  riskScore: number;
  status: "SAFE" | "LOW_THREAT" | "HIGH_THREAT" | "EMERGENCY";
  threatType: string;
  locationTrail: { lat: number; lng: number; time: string }[];
  blockHash: string; // Simulated blockchain tamper-proof hash for legal evidence
  isBlockchainCertified: boolean;
  aiDetailedAssessment?: string;
  safetyInstructions?: string[];
}

export interface RingState {
  connected: boolean;
  batteryLevel: number;
  isCharging: boolean;
  selectedColor: RingColor;
  firmwareVersion: string;
  microphoneActive: boolean;
  gestureThreshold: number; // Squeeze pressure limit (e.g. 75%)
  calibrationPattern: ("Short" | "Long")[]; // E.g., [Short, Short, Short, Long]
  currentSqueezeInput: ("Short" | "Long")[];
  lastHapticFeedback: string; // Message on what vibration occurred
}
