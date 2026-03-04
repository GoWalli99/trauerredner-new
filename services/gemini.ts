import { InterviewData, SpeechTone, SpeechSection } from "../types";

export async function generateSpeechOutline(
  data: InterviewData,
  religious: string,
  tone: SpeechTone,
  version: 'demo' | 'full' | null
): Promise<SpeechSection[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  // Wir erzwingen hier knallhart die v1 Version in der URL
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const prompt = `Handle als Trauerredner. Erstelle eine Rede für ${data.deceasedName}. Stil: ${tone}. Antworte NUR als JSON-Array mit Objekten (id, title, content).`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const result = await response.json();
    const text = result.candidates[0].content.parts[0].text;
    const jsonString = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("Direkter API-Fehler:", error);
    return [{ id: '1', title: 'Verbindung fehlgeschlagen', content: 'Die KI-Schnittstelle ist aktuell nicht erreichbar.' }];
  }
}