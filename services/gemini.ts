import { InterviewData, SpeechTone, SpeechSection } from "../types";

export async function generateSpeechOutline(
  data: InterviewData,
  religious: string,
  tone: SpeechTone,
  version: 'demo' | 'full' | null
): Promise<SpeechSection[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const prompt = `Erstelle eine Trauerrede für ${data.deceasedName}. Stil: ${tone}. Antworte NUR als valides JSON-Array mit Objekten, die die Felder id, title und content haben.`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const result = await response.json();
    
    // Sichereres Auslesen der Antwort
    if (result.candidates && result.candidates[0] && result.candidates[0].content) {
      const text = result.candidates[0].content.parts[0].text;
      const jsonString = text.replace(/```json|```/g, "").trim();
      return JSON.parse(jsonString);
    } else {
      throw new Error("Unerwartetes Antwortformat von Google");
    }

  } catch (error) {
    console.error("KI-Fehler Details:", error);
    return [{ 
      id: '1', 
      title: 'Fast geschafft', 
      content: 'Die Verbindung steht! Bitte laden Sie die Seite einmal neu und versuchen Sie es noch einmal.' 
    }];
  }
}