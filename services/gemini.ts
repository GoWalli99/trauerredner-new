import { InterviewData, SpeechTone, SpeechSection } from "../types";

export async function generateSpeechOutline(
  data: InterviewData,
  religious: string,
  tone: SpeechTone,
  version: 'demo' | 'full' | null
): Promise<SpeechSection[]> {
  // Wir nutzen .trim() und die STABILE v1 URL
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim(); 
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Schreibe eine Trauerrede für ${data.deceasedName}. Stil: ${tone}.` }] }]
      })
    });

    const result = await response.json();
    
    // Falls Google einen Fehler meldet (wie in Bild 20/21)
    if (result.error) {
      throw new Error(result.error.message);
    }

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Keine Antwort erhalten");

    return [{ id: '1', title: 'Ihre Trauerrede', content: text }];

  } catch (error: any) {
    return [{ id: '1', title: 'Status', content: `Fehler: ${error.message}` }];
  }
}