import { GoogleGenerativeAI } from "@google/generative-ai";
import { InterviewData, SpeechTone, SpeechSection } from "../types";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function generateSpeechOutline(
  data: InterviewData,
  religious: string,
  tone: SpeechTone,
  version: 'demo' | 'full' | null
): Promise<SpeechSection[]> {
  const isDemo = version === 'demo';
  const prompt = `Handle als erfahrener Trauerredner. Erstelle eine Rede für ${data.deceasedName}. Stil: ${tone}. Antworte NUR als valides JSON-Array mit Objekten (id, title, content).`;

  try {
    // Wir nutzen Flash 1.5, das ist am schnellsten und stabilsten für Web-Apps
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Bereinigung von eventuellen Markdown-Zusätzen
    const jsonString = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("KI-Fehler:", error);
    return [{ 
      id: '1', 
      title: 'Verbindung wird aufgebaut', 
      content: 'Die KI antwortet gerade. Bitte warten Sie 10 Sekunden und drücken Sie dann erneut auf Generieren.' 
    }];
  }
}