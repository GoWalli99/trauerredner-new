import { InterviewData, SpeechTone, SpeechSection } from "../types";

export async function generateSpeechOutline(
  data: InterviewData,
  religious: string,
  tone: SpeechTone,
  version: 'demo' | 'full' | null
): Promise<SpeechSection[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  // Wir nutzen v1, da v1beta laut Bild 15 und 16 Fehlermeldungen gab
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const prompt = `Handle als erfahrener Trauerredner. Erstelle eine einfühlsame Rede für ${data.deceasedName}. 
  Stil: ${tone}. Religiöser Bezug: ${religious}. 
  Strukturiere die Rede in klare Abschnitte (Einleitung, Lebensweg, Abschied).`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const result = await response.json();
    
    // Falls Google einen Fehler wie in Bild 20 meldet
    if (result.error) {
      throw new Error(result.error.message || "API Fehler");
    }

    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) throw new Error("Keine Antwort erhalten");

    // Wir geben den Text einfach direkt aus, um JSON-Probleme (Bild 19) zu umgehen
    return [{ id: '1', title: 'Ihre persönliche Trauerrede', content: rawText }];

  } catch (error: any) {
    return [{ id: '1', title: 'Status', content: `Fehler: ${error.message}. Bitte Key prüfen.` }];
  }
}