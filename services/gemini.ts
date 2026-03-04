import { InterviewData, SpeechTone, SpeechSection } from "../types";

export async function generateSpeechOutline(
  data: InterviewData,
  religious: string,
  tone: SpeechTone,
  version: 'demo' | 'full' | null
): Promise<SpeechSection[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  // Wir nutzen gemini-1.0-pro - das "Ur-Modell", das fast immer freigeschaltet ist
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${apiKey}`;

  const prompt = `Erstelle eine kurze Trauerrede für ${data.deceasedName}. Stil: ${tone}.`;

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
      throw new Error(result.error.message);
    }

    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error("Keine Antwort erhalten");

    return [{ id: '1', title: 'Ihre Trauerrede', content: rawText }];

  } catch (error: any) {
    return [{ id: '1', title: 'Status', content: `Fehler: ${error.message}` }];
  }
}