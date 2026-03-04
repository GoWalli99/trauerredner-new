import { GoogleGenerativeAI } from "@google/generative-ai";
import { InterviewData, SpeechTone, SpeechSection } from "../types";

// Wir initialisieren die API und erzwingen die stabile Version v1
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function generateSpeechOutline(
  data: InterviewData,
  religious: string,
  tone: SpeechTone,
  version: 'demo' | 'full' | null
): Promise<SpeechSection[]> {
  const isDemo = version === 'demo';
  
  // Kompakter Prompt für maximale Stabilität
  const prompt = `Erstelle eine Trauerrede für ${data.deceasedName}. Stil: ${tone}. 
  Antworte NUR im JSON-Format als Array von Objekten mit id, title und content.`;

  try {
    // Hier erzwingen wir die stabile API-Version
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: "v1" });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Bereinigung falls Markdown-Tags geliefert werden
    const jsonString = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("KI-Fehler:", error);
    return [{ 
      id: '1', 
      title: 'Technischer Hinweis', 
      content: 'Die Rede wird vorbereitet. Bitte drücken Sie in 30 Sekunden noch einmal auf Generieren.' 
    }];
  }
}