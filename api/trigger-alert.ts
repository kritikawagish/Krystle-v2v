import { dispatchAlert } from "./_lib/threat-engine";
import type { GenericApiRequest, GenericApiResponse } from "./_lib/http-types";

// Vercel automatically turns this file into: POST /api/trigger-alert
// This route now awaits dispatchAlert(), because real SMS sending through Twilio is asynchronous.
export default async function handler(req: GenericApiRequest, res: GenericApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { contacts, location, triggerMethod, timestamp } = req.body || {};
    const result = await dispatchAlert(contacts, location, triggerMethod, timestamp);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("trigger-alert handler error:", err);
    return res.status(500).json({ success: false, error: "Internal SOS dispatch error." });
  }
}

