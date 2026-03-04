import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { InterviewData, SpeechTone, SpeechSection } from "../types";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function generateSpeechOutline(
  data: InterviewData,
  religious: string,
  tone: SpeechTone,
  version: 'demo' | 'full' | null
): Promise<SpeechSection[]> {
  const isDemo = version === 'demo';
  const prompt = `
    Handle als erfahrener Trauerredner und erstelle eine ${isDemo ? 'SEHR KURZE Gliederung (NUR DIE ERSTE SEKTION)' : 'SEHR AUSFÜHRLICHE Gliederung'} und Entwurfstexte für eine Grabrede. 
    BASISDATEN: Name: ${data.deceasedName}, Familie: ${data.partnerName}, Kinder: ${data.childrenNames}.
    STIL: ${tone}
    Erstelle für jede Sektion einen langen, ausformulierten Entwurfstext (mindestens 200-300 Wörter).
  `;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error("Keine Antwort von Gemini erhalten");
    }

    const cleanedText = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanedText);

  } catch (error) {
    console.error("Fehler bei der KI-Generierung:", error);
    return [{ 
      id: '1', 
      title: 'Fehler', 
      content: 'Die Generierung ist fehlgeschlagen. Bitte prüfen Sie Ihre Internetverbindung oder versuchen Sie es später erneut.' 
    }];
  }
}