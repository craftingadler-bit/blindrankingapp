import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "API Key fehlt" }, { status: 500 });
  }

  try {
    // Wir fragen direkt die Google-Schnittstelle ab
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Wir extrahieren nur die Namen, damit es übersichtlich bleibt
    const modelNames = data.models?.map((m: any) => m.name.replace('models/', '')) || [];

    return NextResponse.json({ 
      availableModels: modelNames,
      fullData: data 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}