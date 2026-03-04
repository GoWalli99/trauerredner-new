import { InterviewData, SpeechTone, SpeechSection } from "../types";

export async function generateSpeechOutline(
  data: InterviewData,
  religious: string,
  tone: SpeechTone,
  version: 'demo' | 'full' | null
): Promise<SpeechSection[]> {
  // .trim() ist unsere Geheimwaffe gegen das Leerzeichen aus Bild 24
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim(); 
  
  // Wir nutzen die STABILE v1 URL (nicht v1beta), um den 404 aus Bild 27 zu umgehen
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const prompt = `Handle als erfahrener Trauerredner. Erstelle eine einfühlsame Rede für ${data.deceasedName}. 
  Stil: ${tone}. Religiöser Bezug: ${religious}. 
  Antworte direkt mit dem Text der Rede.`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const result = await response.json();
    
    // Falls Google einen Fehler sendet (wie "Abrechnung einrichten" in Bild 26)
    if (result.error) {
      throw new Error(result.error.message);
    }

    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error("KI hat keinen Text geliefert.");

    return [{ id: '1', title: 'Ihre persönliche Trauerrede', content: rawText }];

  } catch (error: any) {
    return [{ 
      id: '1', 
      title: 'Status der Generierung', 
      content: `Hinweis: ${error.message}. Bitte prüfen Sie, ob der neue Key in Vercel ohne Leerzeichen gespeichert wurde.` 
    }];
  }
}