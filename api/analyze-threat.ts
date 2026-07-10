import { analyzeThreat } from "./lib/threat-engine";
import type { GenericApiRequest, GenericApiResponse } from "./lib/http-types";

// Vercel automatically turns this file into: POST /api/analyze-threat
// (Typed loosely on purpose - avoids pulling in @vercel/node as a dependency.
// At runtime Vercel injects req/res objects that are a superset of these.)
export default async function handler(req: GenericApiRequest, res: GenericApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { transcript, audioSnippetLengthSec, simulatedAudio } = req.body || {};

    if (!transcript) {
      return res.status(400).json({ error: "No vocal transcript or vocal indicator provided for analysis." });
    }

    const result = await analyzeThreat(transcript, audioSnippetLengthSec, simulatedAudio);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("analyze-threat handler error:", err);
    return res.status(500).json({ success: false, error: "Internal threat analysis error." });
  }
}
