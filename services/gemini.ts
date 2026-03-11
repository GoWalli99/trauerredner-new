export async function generateSpeechOutline(
  data: InterviewData,
  religious: string,
  tone: SpeechTone,
  version: 'demo' | 'full' | null
): Promise<SpeechSection[]> {
  const isDemo = version === 'demo';
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim(); 
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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

    WICHTIG FÜR DIE VOLLVERSION (NICHT DEMO): 
    - Integriere in den Text der Sektion 1 (Begrüßung) zu Beginn ein passendes, tiefgründiges Zitat eines Klassikers (z.B. Goethe, Rilke).
    - Integriere in den Text der Sektion 8 (Schlussworte) am Ende ein weiteres Zitat.
    - Nenne den Autor namentlich im fließenden Text.

    AUSGABE-FORMAT:
    Gib das Ergebnis AUSSCHLIESSLICH als gültiges JSON-Array zurück. 
    Jedes Objekt im Array muss exakt diese Felder haben: "id", "title" und "content".
    Kein einleitender Text, kein Markdown, nur das reine JSON.
  `;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error.message);
    }

    const rawText = result.candidates[0].content.parts[0].text;
    const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);

  } catch (error: any) {
    console.error("Fehler bei der KI-Generierung:", error);
    return [{ 
      id: '1', 
      title: 'Fehler-Diagnose', 
      content: `Verbindung fehlgeschlagen: ${error.message}` 
    }];
  }
}