import { InterviewData, SpeechTone, SpeechSection } from "../types";

export async function generateSpeechOutline(
  data: InterviewData,
  religious: string,
  tone: SpeechTone,
  version: 'demo' | 'full' | null
): Promise<SpeechSection[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  // Wechsel auf das stabilere gemini-pro Modell
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

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
    
    if (result.error) {
      throw new Error(result.error.message || "API Fehler");
    }

    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) throw new Error("Keine Antwort erhalten");

    return [{ id: '1', title: 'Ihre persönliche Trauerrede', content: rawText }];

  } catch (error: any) {
    return [{ id: '1', title: 'Status', content: `Fehler: ${error.message}. Bitte versuchen Sie es gleich noch einmal.` }];
  }
}