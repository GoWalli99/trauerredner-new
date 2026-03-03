
import { GoogleGenAI, Type } from "@google/genai";
import { InterviewData, SpeechTone, SpeechSection } from "../types";

// Initialize the GoogleGenAI client using the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateSpeechOutline(
  data: InterviewData,
  religious: string,
  tone: SpeechTone,
  version: 'demo' | 'full' | null
): Promise<SpeechSection[]> {
  const isDemo = version === 'demo';
  const prompt = `
    Handle als erfahrener Trauerredner und erstelle eine ${isDemo ? 'SEHR KURZE Gliederung (NUR DIE ERSTE SEKTION)' : 'SEHR AUSFÜHRLICHE Gliederung'} und Entwurfstexte für eine Grabrede. 
    ${isDemo ? 'Da dies eine Demo-Version ist, erstelle NUR die erste Sektion (Begrüßung & Sammlung) mit etwa 200-300 Wörtern.' : 'Integriere alle Details empathisch und flüssig.'}

    BASISDATEN:
    Name: ${data.deceasedName} (${data.birthDate} in ${data.birthPlace} bis ${data.deathDate} in ${data.deathPlace})
    Familie: Partner ${data.partnerName}, Ehe-Details: ${data.marriageDetails}, Kennenlernen: ${data.partnerMeeting}
    Kinder: ${data.childrenNames}, Enkel: ${data.grandchildrenNames}
    Eltern: ${data.parentsNames}, Geschwister: ${data.siblingsDetails}, Wievieltes Kind: ${data.birthOrder}
    Krankheiten/Unterstützer: ${data.medicalSupporters}
    Religion: ${data.religion} (${religious})
    Vereine: ${data.clubMemberships}
    Sonstiges (Grunddaten): ${data.otherGrunddaten}

    BIOGRAFIE & LEBENSWEG:
    Jugend: ${data.bio_youth_details}
    Ursprünglicher Beruf: ${data.bio_original_profession}
    Qualifikationen: ${data.bio_qualifications}
    Zuletzt tätig als: ${data.bio_last_profession}
    Hobbys: ${data.bio_hobbies_list}
    Gemeinsame Hobbys (Partner): ${data.bio_shared_hobbies}
    Sonstiges: ${data.bio_other}

    CHARAKTER & WESEN:
    Charakter (3 Worte): ${data.personality_3words}
    Typisches Wesen: ${data.personality_typical}
    Eigenschaften: ${data.personality_traits}
    Was glücklich machte: ${data.personality_happy}
    Wohlfühlorte: ${data.personality_wellbeing_places}

    WERTE & SCHLÜSSELERLEBNISSE:
    Werte & Meilensteine: ${data.values_milestones}
    Freunde & Kontakte: ${data.friends_contacts}
    Krisen & Bewältigung: ${data.crises_handling}

    ABSCHLUSS & WÜNSCHE:
    Krankheit/Abschied: ${data.illness_death}
    Unbedingt erwähnen: ${data.speech_must_haves}
    TABUS (Nicht erwähnen!): ${data.speech_taboos}
    Danksagungen & Namen: ${data.thanks_names}
    Ergänzende Notizen: ${data.additional_notes}

    STIL: ${tone}

    DIE GLIEDERUNG MUSS FOLGENDE SEKTIONEN ENTHALTEN:
    ${isDemo ? '1. Begrüßung & Sammlung (Bezug zum Ort und Anlass)' : `
    1. Begrüßung & Sammlung (Bezug zum Ort und Anlass)
    2. Lebensrückblick (Die Reise von der Kindheit bis zum Lebensabend)
    3. Der Mensch hinter den Daten (Wesen, Charakter, Humor)
    4. Hobbys, Leidenschaften & Kleine Freuden (Ausführlich: Was das Herz erfüllte)
    5. Werte, Spuren & Vermächtnis (Was bleibt von ${data.deceasedName}?)
    6. Persönliche Anekdote & Würdigung (Ein lebendiges Bild zeichnen)
    7. Trostgedanken & Letzter Abschied (Hinführung zur Beisetzung)
    8. Schlussworte & Dank (Inkl. Namenserwähnungen der Angehörigen)
    `}

    Generiere für ${isDemo ? 'die erste Sektion' : 'JEDEN Punkt'} einen langen, ausformulierten Entwurfstext (mindestens 200-300 Wörter pro Sektion), kein reines Stichwortverzeichnis.
    WICHTIG: Füge KEINE Hinweise, Disclaimers, Metatexte oder Anmerkungen zur Demo-Version oder zum Umfang in den generierten Text ein. Der Text soll direkt mit der Rede beginnen.

    ${isDemo ? '' : 'ZUSÄTZLICH für die Vollversion: Integriere in die erste Sektion (Begrüßung) und in die letzte Sektion (Schlussworte) jeweils ein passendes, tiefgründiges Zitat eines Klassikers (z.B. Goethe, Schiller, Rilke etc.). Das Zitat muss flüssig in den Text eingebaut werden und der Autor muss namentlich genannt werden (z.B. "Wie Goethe schon sagte...").'}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Complex task requires high-quality reasoning
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              content: { type: Type.STRING }
            },
            required: ["id", "title", "content"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No content received from Gemini API");
    }

    return JSON.parse(text);
  } catch (error) {
    console.error("Fehler bei der KI-Generierung:", error);
    return [{ id: '1', title: 'Fehler', content: 'Die Generierung ist fehlgeschlagen. Bitte prüfen Sie Ihre Internetverbindung oder versuchen Sie es später erneut.' }];
  }
}
