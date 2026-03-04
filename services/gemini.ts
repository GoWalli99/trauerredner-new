import { GoogleGenerativeAI } from "@google/generative-ai";
import { InterviewData, SpeechTone, SpeechSection } from "../types";

// Initialisierung
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function generateSpeechOutline(
  data: InterviewData,
  religious: string,
  tone: SpeechTone,
  version: 'demo' | 'full' | null
): Promise<SpeechSection[]> {
  const isDemo = version === 'demo';
  const prompt = `Handle als Trauerredner. Erstelle eine Rede für ${data.deceasedName}. Stil: ${tone}. Antworte NUR als JSON-Array mit Objekten (id, title, content).`;

  try {
    // Wir nutzen "gemini-pro" - das ist das am weitesten verbreitete Standardmodell
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    if (!text) throw new Error("Kein Text empfangen");

    const jsonString = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("KI-Fehler:", error);
    return [{ 
      id: '1', 
      title: 'Fehler bei der Verbindung', 
      content: 'Die KI konnte nicht erreicht werden. Bitte prüfen Sie, ob Ihr API-Key in Vercel korrekt hinterlegt ist.' 
    }];
  }
}