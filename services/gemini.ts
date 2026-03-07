import { InterviewData, SpeechTone, SpeechSection } from "../types";

export async function generateSpeechOutline(
  data: InterviewData,
  religious: string,
  tone: SpeechTone,
  version: 'demo' | 'full' | null
): Promise<SpeechSection[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim(); 
  // Stabile URL für neue Projekte
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Schreibe eine Trauerrede für ${data.deceasedName}.` }] }]
      })
    });

    const result = await response.json();
    if (result.error) throw new Error(result.error.message);

    const text = result.candidates[0].content.parts[0].text;
    return [{ id: '1', title: 'Ihre Trauerrede', content: text }];
  } catch (error: any) {
    return [{ id: '1', title: 'Fehler-Diagnose', content: error.message }];
  }
}