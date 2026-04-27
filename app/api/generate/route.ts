import { GoogleGenerativeAI, GenerateContentResult } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Prioritätenliste für das Modell-Hopping
const MODEL_PRIORITY: string[] = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3-flash"
];

export async function POST(req: Request) {
  try {
    // 1. Topic aus dem Request parsen
    const { topic }: { topic: string } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Kein Thema angegeben" }, { status: 400 });
    }

    // 2. Modelle der Reihe nach durchprobieren (Fall-back Logik)
    for (const modelName of MODEL_PRIORITY) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: { maxOutputTokens: 250, temperature: 0.7 }
        });

        const prompt = `Erstelle eine Liste von genau 5 bekannten Objekten zu: "${topic}". Antworte NUR als JSON-Array: ["A", "B", ...]`;
        
        const result: GenerateContentResult = await model.generateContent(prompt);
        const text = result.response.text().trim();
        
        // Extrahiert das JSON-Array aus der Antwort
        const match = text.match(/\[.*\]/s);
        if (!match) continue; // Falls kein JSON gefunden wurde, nächstes Modell

        const items: string[] = JSON.parse(match[0]);
        
        // Erfolg: Antwort mit Daten und dem genutzten Modell senden
        return NextResponse.json({ items, modelUsed: modelName });

      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Unbekannter Modell-Fehler";
        console.warn(`Modell ${modelName} fehlgeschlagen: ${errorMessage}`);
        // Schleife läuft weiter zum nächsten Modell
        continue;
      }
    }

    // 3. Wenn kein Modell funktioniert hat
    throw new Error("Alle KI-Modelle sind aktuell überlastet oder das Kontingent ist erschöpft.");

  } catch (error: unknown) {
    const finalErrorMessage = error instanceof Error ? error.message : "Ein kritischer Fehler ist aufgetreten";
    return NextResponse.json({ error: finalErrorMessage }, { status: 500 });
  }
}