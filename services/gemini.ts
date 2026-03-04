import { InterviewData, SpeechTone, SpeechSection } from "../types";

export async function generateSpeechOutline(
  data: InterviewData,
  religious: string,
  tone: SpeechTone,
  version: 'demo' | 'full' | null
): Promise<SpeechSection[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  // Wir bitten die KI, nur das reine Array ohne Markdown-Zusätze zu schicken
  const prompt = `Erstelle eine Trauerrede für ${data.deceasedName}. Stil: ${tone}. 
  Antworte ausschließlich mit einem validen JSON-Array. Beispiel: [{"id": "1", "title": "Einleitung", "content": "Text..."}]`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const result = await response.json();
    
    // Wir prüfen alle Ebenen der Google-Antwort ab
    const candidate = result.candidates?.[0];
    const rawText = candidate?.content?.parts?.[0]?.text;

    if (!rawText) {
      console.error("Roher Antwort-Inhalt:", result);
      throw new Error("Keine Text-Antwort gefunden");
    }

    // Wir entfernen ALLES, was kein JSON ist (z.B. ```json ... ```)
    const jsonStart = rawText.indexOf('[');
    const jsonEnd = rawText.lastIndexOf(']') + 1;
    const cleanJson = rawText.substring(jsonStart, jsonEnd);

    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("Detail-Fehler:", error);
    return [{ 
      id: '1', 
      title: 'Fast geschafft', 
      content: 'Die KI hat geantwortet, aber das Format war noch nicht ideal. Bitte klicken Sie einfach noch einmal auf Generieren.' 
    }];
  }
}