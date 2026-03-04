import { InterviewData, SpeechTone, SpeechSection } from "../types";

export async function generateSpeechOutline(
  data: InterviewData,
  religious: string,
  tone: SpeechTone,
  version: 'demo' | 'full' | null
): Promise<SpeechSection[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim(); // .trim() entfernt Leerzeichen automatisch!
  
  // Liste der möglichen Modelle, die wir nacheinander testen
  const modelsToTest = [
    "gemini-1.5-flash",
    "gemini-pro",
    "gemini-1.0-pro"
  ];

  let lastError = "";

  for (const modelName of modelsToTest) {
    try {
      // Wir nutzen v1beta, da dies für die meisten Free-Tier Keys der Standard ist
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Schreibe ein Wort als Test für das Modell ${modelName}` }] }]
        })
      });

      const result = await response.json();

      if (!result.error) {
        // ERFOLG! Dieses Modell funktioniert. Jetzt schicken wir den echten Prompt.
        const prompt = `Handle als Trauerredner für ${data.deceasedName}. Stil: ${tone}.`;
        const finalResponse = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const finalResult = await finalResponse.json();
        const text = finalResult.candidates[0].content.parts[0].text;
        return [{ id: '1', title: `Erfolg mit ${modelName}`, content: text }];
      } else {
        lastError = result.error.message;
      }
    } catch (e: any) {
      lastError = e.message;
    }
  }

  return [{ id: '1', title: 'Diagnose-Ergebnis', content: `Keines der Modelle konnte erreicht werden. Letzte Meldung: ${lastError}. Bitte prüfen Sie den Key in Vercel auf Leerzeichen.` }];
}