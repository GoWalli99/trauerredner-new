
import React, { useState, useEffect } from 'react';
import { Share2, MoreVertical, FileText, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { 
  INITIAL_INTERVIEW, 
  AppState, 
  InterviewData, 
  SpeechTone, 
  SpeechSection 
} from './types';
import { generateSpeechOutline } from './services/gemini';

// --- Sub-Components ---

const exportInterviewToWord = (data: InterviewData, isEmpty = false) => {
  if (!isEmpty && !data.deceasedName) return;

  const title = isEmpty ? "Leere Frageliste - Leitfaden (A-F)" : `Frageliste - Leitfaden für ${data.deceasedName}`;
  const date = new Date().toLocaleDateString();

  const htmlHeader = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <style>
        @page WordSection1 {
          size: 595.3pt 841.9pt;
          margin: 70.85pt 70.85pt 70.85pt 70.85pt;
          mso-header-margin: 35.4pt;
          mso-footer-margin: 35.4pt;
          mso-footer: f1;
        }
        div.WordSection1 { page: WordSection1; }
        body { font-family: Arial, sans-serif; font-size: 12pt; }
        h1 { font-size: 18pt; font-weight: bold; text-align: center; }
        h2 { font-size: 14pt; font-weight: bold; margin-top: 15pt; border-bottom: 1px solid #000; }
        .field { margin-bottom: 8pt; border-bottom: 1px solid #eee; padding-bottom: 4pt; }
        .label { font-weight: bold; color: #333; display: block; margin-bottom: 2pt; }
        .value { color: #000; }
        p.MsoFooter { 
          margin: 0in; 
          text-align: center; 
          font-family: Arial, sans-serif; 
          font-size: 10pt;
        }
      </style>
    </head>
    <body>
      <div class="WordSection1">
        <h1>${title}</h1>
        <p><i>Automatisch gespeichert am ${date}</i></p>
  `;

  const sections = [
    { title: 'A) Organisatorisches', fields: [
      { label: '1. Trauerfeier findet statt am:', value: data.ceremonyDate },
      { label: '2. Beginn (Uhrzeit):', value: data.ceremonyTime },
      { label: '3. Friedhofsanschrift:', value: data.cemeteryAddress },
      { label: '4. Genauer Treffpunkt:', value: data.meetingPoint },
      { label: '5. Bestattungsformen:', value: data.burialType },
      { label: '6. Grabformen für die Urne:', value: data.visitorCount },
      { label: '7. Ort, wo die Rede gehalten werden soll:', value: data.speechLocation },
      { label: '8. Geleit zum Grab?:', value: data.graveEscort },
      { label: '9. Ist eine Trauerkarte /Fotos vorhanden?:', value: data.funeralCardPhotos },
      { label: '10. Gibt es eine Musikbegleitung:', value: data.musicAccompaniment },
      { label: '11. Sonstiges (Organisatorisch):', value: data.otherOrganisational },
    ]},
    { title: 'B) Grunddaten', fields: [
      { label: '12. Vollständiger Name / Spitzname:', value: data.deceasedName },
      { label: '13. Geburtsdatum:', value: data.birthDate },
      { label: '14. Geburtsort:', value: data.birthPlace },
      { label: '15. Sterbedatum:', value: data.deathDate },
      { label: '16. Sterbeort:', value: data.deathPlace },
      { label: '17. Letzter Wohnort:', value: data.lastResidence },
      { label: '18. Familienstand:', value: data.maritalStatus },
      { label: '19. Name Partner(in):', value: data.partnerName },
      { label: '20. Heiraten (Anzahl Ehejahre usw.):', value: data.marriageDetails },
      { label: '21. Kennenlernen des Partners (Wo, Wann, Umstände):', value: data.partnerMeeting },
      { label: '22. Namen der Nachkommen (Kinder):', value: data.childrenNames },
      { label: '23. Namen der Nachkommen (Enkel):', value: data.grandchildrenNames },
      { label: '24. Eltern:', value: data.parentsNames },
      { label: '25. Anzahl und Namen der Geschwister:', value: data.siblingsDetails },
      { label: '26. Wievieltes Kind bei der Geburt?:', value: data.birthOrder },
      { label: '27. Religion:', value: data.religion },
      { label: '28. Hervorzuhebende Krankheiten & aktive Unterstützer:', value: data.medicalSupporters },
      { label: '29. Mitglied in Vereinen:', value: data.clubMemberships },
      { label: '30. sonstiges:', value: data.otherGrunddaten },
    ]},
    { title: 'C) Lebensgeschichte', fields: [
      { label: '31. Ablauf der Jugend (wo erlebt, Ort, prägende Freizeitbeschäftigung, Hobbys):', value: data.bio_youth_details },
      { label: '32. Ursprünglich erlernter Beruf:', value: data.bio_original_profession },
      { label: '33. Zuletzt beschäftigt mit folgenden beruflichen Tätigkeiten:', value: data.bio_last_profession },
      { label: '34. Qualifikationen - Studium und Weiterbildungen Aufzählung):', value: data.bio_qualifications },
      { label: '35. Hobbys (Aufzählung):', value: data.bio_hobbies_list },
      { label: '36. Gemeinsame Hobbys mit Partnerin in der Freizeit, besonders aber im Urlaub:', value: data.bio_shared_hobbies },
      { label: '37. sonstiges:', value: data.bio_other },
    ]},
    { title: 'D) Charakter', fields: [
      { label: '38. In 3 Worten beschreiben:', value: data.personality_3words },
      { label: '39. Was war typisch?:', value: data.personality_typical },
      { label: '40. Charaktereigenschaften & Wesenszüge:', value: data.personality_traits },
      { label: '41. Was glücklich machte / Glücksmomente:', value: data.personality_happy },
      { label: '42. Wohlfühlorte - wo fühlte Er/Sie sich besonders hingezogen?:', value: data.personality_wellbeing_places },
    ]},
    { title: 'E) Werte & Abschluss', fields: [
      { label: '43. Werte und Meilensteine des Lebens, d.h. wo ist Er/Sie nach eigener Einschätzung über sich selbst stolz gewesen, welche Projekte/Tätigkeiten oder Leistungen waren es?:', value: data.values_milestones },
      { label: '44. Freunde bzw. welche Kontakte pflegte Er/Sie in den letzten Jahren (Klassen- und Vereinstreffen, einzelne Freunde/Kollegen)?:', value: data.friends_contacts },
      { label: '45. Welche Krisen durchlebte Er/Sie im Leben (Arbeitlosigkeit, Krankheit) und wie bewältigte Er/Sie diese Lebensabschnitte?:', value: data.crises_handling },
      { label: '46. Krankheit, Sterben, Abschied (Sensibel):', value: data.illness_death },
      { label: '47. Was soll unbedingt vorkommen in der Rede?:', value: data.speech_must_haves },
      { label: '48. Was soll auf KEINEN FALL erwähnt werden Tabus)!:', value: data.speech_taboos },
      { label: '49. Danksagungen und zu nennende Namen:', value: data.thanks_names },
    ]},
    { title: 'F) Ergänzungen', fields: [
      { label: '50. Ergänzungen:', value: data.additional_notes },
    ]}
  ];

  let body = '';
  sections.forEach(s => {
    if (s.title === 'F) Ergänzungen') {
      body += `<div style="page-break-before: always;"></div>`;
      body += `<h2>${s.title}</h2>`;
      body += `<p style="font-style: italic; color: #666; font-size: 10pt;">Hier können Sie manuelle Bemerkungen unter Angabe der jeweiligen Feldnummer als persönliche Notiz beim Erfassungsgespräch beim Kunden vornehmen. Diese Notizen stellen eine Ergänzung dar und dienen Ihnen bei der maschinellen Erfassung der Frageliste als Hilfestellung.</p>`;
      body += `<div style="border: 1px solid #ccc; height: 500px; margin-top: 10px; padding: 10px;">${data.additional_notes || ''}</div>`;
    } else {
      body += `<h2>${s.title}</h2>`;
      s.fields.forEach(f => {
        if (isEmpty || f.value) {
          body += `<div class="field"><span class="label">${f.label}:</span> <span class="value">${isEmpty ? '<br/><br/>__________________________________________________' : f.value}</span></div>`;
        }
      });
    }
  });

  const fullHtml = `
    ${htmlHeader}
    ${body}
    <div style='mso-element:footer' id=f1>
      <p class=MsoFooter>
        <span style='mso-no-proof:yes'>
          <span style='mso-field-code:" PAGE "'></span>
        </span>
      </p>
    </div>
    </div>
  </body>
</html>
  `;
  const blob = new Blob([fullHtml], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = isEmpty ? `Leere_Frageliste.doc` : `Frageliste_${data.deceasedName.replace(/\s/g, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const Header = ({ onShare }: { onShare: () => void }) => (
  <header className="bg-slate-900 text-white py-8 px-4 text-center border-b border-slate-700 relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500 rounded-full blur-3xl"></div>
    </div>
    
    {/* Action Icons */}
    <div className="absolute top-6 right-6 z-20 flex items-center gap-4 text-slate-400">
      <button onClick={onShare} className="hover:text-white transition-colors" title="Teilen">
        <Share2 size={20} />
      </button>
      <button className="hover:text-white transition-colors" title="Mehr">
        <MoreVertical size={20} />
      </button>
    </div>

    <div className="relative z-10 flex flex-col items-center">
      <h1 className="text-4xl font-bold tracking-tight mb-2">Trauerredner Pro - App</h1>
      <p className="text-slate-400 font-light italic">Würdevolle Worte für den letzten Abschied</p>
    </div>
  </header>
);

const PepeLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Blue background rectangle */}
    <rect x="15" y="15" width="110" height="140" fill="#1E88E5" />
    {/* Green foreground rectangle */}
    <rect x="60" y="40" width="110" height="140" fill="#7CB342" />
    {/* Yellow stylized lines */}
    <path 
      d="M30 100 L70 140 M170 80 L190 90" 
      stroke="#FDD835" 
      strokeWidth="4" 
      strokeLinecap="round" 
    />
    <path 
      d="M60 40 L170 80 L170 180 L60 140 Z" 
      fill="none" 
      stroke="#FDD835" 
      strokeWidth="3" 
    />
    {/* Text */}
    <text 
      x="115" 
      y="105" 
      fontFamily="Arial, sans-serif" 
      fontWeight="900" 
      fontStyle="italic" 
      fontSize="24" 
      fill="white" 
      textAnchor="middle"
      style={{ letterSpacing: '1px' }}
    >
      PEPE
    </text>
    <text 
      x="115" 
      y="135" 
      fontFamily="Arial, sans-serif" 
      fontWeight="900" 
      fontStyle="italic" 
      fontSize="24" 
      fill="white" 
      textAnchor="middle"
      style={{ letterSpacing: '1px' }}
    >
      VERLAG
    </text>
  </svg>
);

const MainMenu = ({ onNavigate, version, onLogout }: { onNavigate: (step: AppState['step']) => void, version: AppState['version'], onLogout: () => void }) => (
  <div className="max-w-4xl mx-auto py-16 px-4">
    <div className="flex flex-col items-center mb-12">
      <h2 className="text-2xl font-bold text-slate-800">Willkommen bei Trauerredner Pro</h2>
      <p className="text-slate-500 italic">Ihr Partner für würdevolle Abschiedsreden</p>
    </div>
    <div className="flex justify-between items-center mb-8">
      <button onClick={onLogout} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Abmelden
      </button>
      <span className={`px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider ${version === 'full' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
        {version === 'full' ? 'Vollversion' : 'Demo-Modus'}
      </span>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <button 
        onClick={() => onNavigate('interview')}
        className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col items-center text-center group"
      >
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">1. Erstgespräch</h3>
        <p className="text-slate-500 text-sm">Frageliste (A - F)</p>
      </button>

      <button 
        onClick={() => onNavigate('style')}
        className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col items-center text-center group"
      >
        <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.172-1.172a4 4 0 115.656 5.656L17 12.515" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">2. Stil & Rahmen</h3>
        <p className="text-slate-500 text-sm">Festlegung der Tonalität und Ausrichtung.</p>
      </button>

      <button 
        onClick={() => onNavigate('generation')}
        className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col items-center text-center group"
      >
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">3. Ausführliche Rede</h3>
        <p className="text-slate-500 text-sm">KI-Generierung und Word-Export (Arial 14).</p>
      </button>
    </div>
  </div>
);

const Login = ({ onLogin }: { onLogin: (version: 'demo' | 'full') => void }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '913F7') {
      onLogin('demo');
    } else if (password === '913F6') {
      onLogin('full');
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-xl border border-slate-200">
      <div className="text-center mb-8">
        <div className="mb-6 flex justify-center">
          <div className="bg-white p-3 rounded-xl shadow-md border border-slate-100 w-32 h-32 flex items-center justify-center">
            <PepeLogo className="w-full h-full" />
          </div>
        </div>
        <div className="mb-6 space-y-1">
          <p className="font-bold text-slate-900">Pepe-Verlag</p>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">KI Software</p>
          <p className="text-sm text-slate-600">Erstellung von bis zu 3 gleichzeitig - personalisierten und individuellen Trauerreden. Bei gleichzeitiger Integration von jeweils 2 unterschiedlichen Zitaten - sowie der Auswahl von 2 Zeremonien und 6 Tonalitäten pro Rede.</p>
          <p className="text-xs text-slate-400 uppercase tracking-widest">Version 1.3</p>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Anmeldung</h2>
        <p className="text-slate-500 mt-2">Bitte geben Sie Ihr Passwort ein</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full p-4 border rounded-xl text-center text-2xl tracking-widest focus:ring-2 focus:ring-slate-900 outline-none transition-all ${error ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
            placeholder="•••••"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm text-center mt-2 animate-bounce">Ungültiges Passwort</p>}
        </div>
        <button 
          type="submit"
          className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg"
        >
          Anmelden
        </button>
      </form>
      
      <div className="mt-8 text-center space-y-1">
        <a 
          href="https://pepe-verlag.de" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-slate-500 text-sm font-medium hover:text-slate-800 transition-colors block"
        >
          www.pepe-verlag.de
        </a>
        <p className="text-slate-400 text-xs">E-Mail: info@pepe-verlag.de</p>
      </div>
    </div>
  );
};

// Changed prop type to optional children to avoid strict property checking errors in some TypeScript environments
const SectionTitle = ({ children }: { children?: React.ReactNode }) => (
  <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4 mt-8 uppercase tracking-wide flex items-center gap-2">
    <div className="w-2 h-6 bg-slate-900 rounded-full"></div>
    {children}
  </h3>
);

const ResetButton = ({ onReset }: { onReset: () => void }) => (
  <div className="mt-16 pt-8 border-t border-slate-100 text-center">
    <button 
      onClick={onReset} 
      className="bg-red-50 text-red-600 px-8 py-3 rounded-xl hover:bg-red-100 transition-all text-sm font-bold border border-red-100 shadow-sm active:scale-95"
    >
      Zurück zur Anmeldung
    </button>
    <p className="text-[10px] text-red-400 mt-3 uppercase tracking-widest font-bold">Achtung: Alle Daten werden gelöscht, aber vorher wird der Inhalt der alten Frageliste als Worddatei gesichert!</p>
  </div>
);

const STORAGE_KEY = 'trauerredner_saved_lists';

const InterviewForm = ({ data, onChange, onNext, onReset, version }: { data: InterviewData, onChange: (d: InterviewData) => void, onNext: () => void, onReset: () => void, version: AppState['version'] }) => {
  const [savedLists, setSavedLists] = React.useState<any[]>([]);
  const [showImportList, setShowImportList] = React.useState(false);

  React.useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    setSavedLists(saved);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onChange({ ...data, [e.target.name]: e.target.value });
  };

  const handleSaveAndExport = () => {
    // Save to localStorage
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const index = saved.findIndex((item: any) => item.deceasedName === data.deceasedName && data.deceasedName !== '');
    
    const newList = { ...data, savedAt: new Date().toLocaleString() };
    
    let updated;
    if (index >= 0) {
      updated = [...saved];
      updated[index] = newList;
    } else {
      updated = [...saved, newList];
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSavedLists(updated);
    
    // Export to Word
    exportInterviewToWord(data);
  };

  const handleImport = (savedItem: InterviewData) => {
    onChange(savedItem);
    setShowImportList(false);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-lg my-10 border border-slate-200">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm">1</span>
        Umfassende Frageliste (Leitfaden A-F)
      </h2>
      
      <div className="mb-8 flex flex-col items-end border-b border-slate-100 pb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full justify-between">
          <p className="text-sm text-slate-700 font-medium">
            Zur Vorbereitung eines Erstgepräches können Sie sich hier die umfassende Frageliste ausdrucken --&gt;:
          </p>
          <button 
            onClick={() => version === 'full' && exportInterviewToWord(INITIAL_INTERVIEW, true)}
            disabled={version !== 'full'}
            className={`px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm font-bold border shadow-sm active:scale-95 ${
              version === 'full' 
                ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700' 
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4h10z" />
            </svg>
            Leere Frageliste ausdrucken
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full justify-between mt-4">
          <div className="flex flex-col">
            <p className="text-sm text-slate-700 font-medium">
              Hier können Sie eine bereits vorhandene Frageliste importieren --&gt;:
            </p>
            <p className="text-[11px] text-slate-500 italic mt-1">
              (Bedingung: Die Abspeicherung erfolgte mit dem Button "Ausgefüllte Frageliste speichern und ausdrucken" am Ende dieser Frageliste)
            </p>
          </div>
          <div className="relative">
            <button 
              onClick={() => version === 'full' && setShowImportList(!showImportList)}
              disabled={version !== 'full'}
              className={`px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm font-bold border shadow-sm active:scale-95 ${
                version === 'full' 
                  ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700' 
                  : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import Frageliste
            </button>
            
            {showImportList && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                <div className="p-2 border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Gespeicherte Listen
                </div>
                {savedLists.length === 0 ? (
                  <div className="p-4 text-xs text-slate-400 italic text-center">Keine gespeicherten Listen gefunden</div>
                ) : (
                  savedLists.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleImport(item)}
                      className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                    >
                      <div className="font-bold text-slate-800 text-sm truncate">{item.deceasedName || 'Unbenannt'}</div>
                      <div className="text-[10px] text-slate-400">{item.savedAt}</div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {version !== 'full' && (
          <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-2">
            nur in Vollversion verfügbar
          </p>
        )}
      </div>
      
      <div className="space-y-6">
        <SectionTitle>A) Organisatorisches</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 ml-1">1. Trauerfeier findet statt am:</label>
            <input autoComplete="off" name="ceremonyDate" value={data.ceremonyDate} onChange={handleChange} className="p-2 border rounded" placeholder="Datum" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 ml-1">2. Beginn (Uhrzeit):</label>
            <input autoComplete="off" name="ceremonyTime" value={data.ceremonyTime} onChange={handleChange} className="p-2 border rounded" placeholder="Uhrzeit" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 ml-1">3. Friedhofsanschrift:</label>
            <input autoComplete="off" name="cemeteryAddress" value={data.cemeteryAddress} onChange={handleChange} className="p-2 border rounded" placeholder="Friedhofsanschrift" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 ml-1">4. Genauer Treffpunkt:</label>
            <input autoComplete="off" name="meetingPoint" value={data.meetingPoint} onChange={handleChange} className="p-2 border rounded" placeholder="Genauer Treffpunkt" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 ml-1">5. Bestattungsformen:</label>
            <select name="burialType" value={data.burialType} onChange={handleChange} className="p-2 border rounded bg-white">
              <option value="">Bitte wählen...</option>
              <option value="Erdbestattung (Sarg und Grab)">Erdbestattung (Sarg und Grab)</option>
              <option value="Feuerbestattung (Einäscherung + Urne)">Feuerbestattung (Einäscherung + Urne)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 ml-1">6. Grabformen für die Urne:</label>
            <select name="visitorCount" value={data.visitorCount} onChange={handleChange} className="p-2 border rounded bg-white">
              <option value="">Bitte wählen...</option>
              <option value="Klassisches Grab mit Grabstein">Klassisches Grab mit Grabstein</option>
              <option value="Wahlgrab oder Reihengrab">Wahlgrab oder Reihengrab</option>
              <option value="Parkähnlich gestalteter Bereich - Friedhof">Parkähnlich gestalteter Bereich - Friedhof</option>
              <option value="Gemeinschaftsgrab Friedhof">Gemeinschaftsgrab Friedhof</option>
              <option value="Friedwald extra Baum">Friedwald extra Baum</option>
              <option value="Urne wird im Meer beigesetzt">Urne wird im Meer beigesetzt</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 ml-1">7. Ort, wo die Rede gehalten werden soll:</label>
            <input autoComplete="off" name="speechLocation" value={data.speechLocation} onChange={handleChange} className="p-2 border rounded" placeholder="Ort der Rede" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 ml-1">8. Geleit zum Grab?:</label>
            <input autoComplete="off" name="graveEscort" value={data.graveEscort} onChange={handleChange} className="p-2 border rounded" placeholder="Geleit zum Grab?" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 ml-1">9. Ist eine Trauerkarte /Fotos vorhanden?:</label>
            <input autoComplete="off" name="funeralCardPhotos" value={data.funeralCardPhotos} onChange={handleChange} className="p-2 border rounded" placeholder="Ist eine Trauerkarte /Fotos vorhanden?" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 ml-1">10. Gibt es eine Musikbegleitung:</label>
            <input autoComplete="off" name="musicAccompaniment" value={data.musicAccompaniment} onChange={handleChange} className="p-2 border rounded" placeholder="Gibt es eine Musikbegleitung" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-500 ml-1">11. Sonstiges (Organisatorisch):</label>
          <input autoComplete="off" name="otherOrganisational" value={data.otherOrganisational} onChange={handleChange} className="w-full p-2 border rounded" placeholder="sonstiges" />
        </div>

        <SectionTitle>B) Grunddaten</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 ml-1">12. Vollständiger Name / Spitzname:</label>
            <input autoComplete="off" name="deceasedName" value={data.deceasedName} onChange={handleChange} className="p-2 border rounded" placeholder="Vollständiger Name / Spitzname" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 ml-1">13. Geburtsdatum:</label>
              <input autoComplete="off" name="birthDate" value={data.birthDate} onChange={handleChange} className="p-2 border rounded" placeholder="Geburtstdatum" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 ml-1">14. Geburtsort:</label>
              <input autoComplete="off" name="birthPlace" value={data.birthPlace} onChange={handleChange} className="p-2 border rounded" placeholder="Geburtsort" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 ml-1">15. Sterbedatum:</label>
              <input autoComplete="off" name="deathDate" value={data.deathDate} onChange={handleChange} className="p-2 border rounded" placeholder="Sterbedatum" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 ml-1">16. Sterbeort:</label>
              <input autoComplete="off" name="deathPlace" value={data.deathPlace} onChange={handleChange} className="p-2 border rounded" placeholder="Sterbeort" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 ml-1">17. Letzter Wohnort:</label>
            <input autoComplete="off" name="lastResidence" value={data.lastResidence} onChange={handleChange} className="p-2 border rounded" placeholder="Letzter Wohnort" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 ml-1">18. Familienstand:</label>
            <input autoComplete="off" name="maritalStatus" value={data.maritalStatus} onChange={handleChange} className="p-2 border rounded" placeholder="Familienstand" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 ml-1">19. Name Partner(in):</label>
            <input autoComplete="off" name="partnerName" value={data.partnerName} onChange={handleChange} className="p-2 border rounded" placeholder="Name Partner(in)" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 ml-1">20. Heiraten (Anzahl Ehejahre usw.):</label>
            <input autoComplete="off" name="marriageDetails" value={data.marriageDetails} onChange={handleChange} className="p-2 border rounded" placeholder="Heiraten (Anzahl Ehejahre usw.):" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 ml-1">21. Kennenlernen des Partners (Wo, Wann, Umstände):</label>
            <input autoComplete="off" name="partnerMeeting" value={data.partnerMeeting} onChange={handleChange} className="p-2 border rounded" placeholder="Kennenlernen des Partners (Wo, Wann, Umstände):" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 ml-1">22. Namen der Nachkommen (Kinder):</label>
            <textarea autoComplete="off" name="childrenNames" value={data.childrenNames} onChange={handleChange} className="p-2 border rounded h-20" placeholder="Namen der Nachkommen (Kinder):" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 ml-1">23. Namen der Nachkommen (Enkel):</label>
            <textarea autoComplete="off" name="grandchildrenNames" value={data.grandchildrenNames} onChange={handleChange} className="p-2 border rounded h-20" placeholder="Namen der Nachkommen (Enkel):" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 ml-1">24. Eltern:</label>
            <input autoComplete="off" name="parentsNames" value={data.parentsNames} onChange={handleChange} className="p-2 border rounded" placeholder="Eltern:" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 ml-1">25. Anzahl und Namen der Geschwister:</label>
            <input autoComplete="off" name="siblingsDetails" value={data.siblingsDetails} onChange={handleChange} className="p-2 border rounded" placeholder="Anzahl und Namen der Geschwister:" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 ml-1">26. Wievieltes Kind bei der Geburt?:</label>
            <input autoComplete="off" name="birthOrder" value={data.birthOrder} onChange={handleChange} className="p-2 border rounded" placeholder="Wievieltes Kind bei der Geburt?:" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 ml-1">27. Religion:</label>
            <input autoComplete="off" name="religion" value={data.religion} onChange={handleChange} className="p-2 border rounded" placeholder="Religion:" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-500 ml-1">28. Hervorzuhebende Krankheiten & aktive Unterstützer:</label>
          <textarea autoComplete="off" name="medicalSupporters" value={data.medicalSupporters} onChange={handleChange} className="w-full p-2 border rounded h-20" placeholder="Hervorzuhebende Krankheiten & aktive Unterstützer:" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-500 ml-1">29. Mitglied in Vereinen:</label>
          <input autoComplete="off" name="clubMemberships" value={data.clubMemberships} onChange={handleChange} className="w-full p-2 border rounded" placeholder="Mitglied in Vereinen:" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-500 ml-1">30. sonstiges:</label>
          <input autoComplete="off" name="otherGrunddaten" value={data.otherGrunddaten} onChange={handleChange} className="w-full p-2 border rounded" placeholder="sonstiges" />
        </div>

        <SectionTitle>C) Lebensgeschichte (Biografie)</SectionTitle>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-500 ml-1">31. Ablauf der Jugend (wo erlebt, Ort, prägende Freizeitbeschäftigung, Hobbys):</label>
          <textarea autoComplete="off" name="bio_youth_details" value={data.bio_youth_details} onChange={handleChange} className="w-full p-2 border rounded h-24" placeholder="Ablauf der Jugend (wo erlebt, Ort, prägende Freizeitbeschäftigung, Hobbys):" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 ml-1">32. Ursprünglich erlernter Beruf:</label>
            <input autoComplete="off" name="bio_original_profession" value={data.bio_original_profession} onChange={handleChange} className="p-2 border rounded" placeholder="Ursprünglich erlernter Beruf:" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 ml-1">33. Zuletzt beschäftigt mit folgenden beruflichen Tätigkeiten:</label>
            <input autoComplete="off" name="bio_last_profession" value={data.bio_last_profession} onChange={handleChange} className="p-2 border rounded" placeholder="Zuletzt beschäftigt mit folgenden beruflichen Tätigkeiten:" />
          </div>
        </div>
        <div className="flex flex-col gap-1 mt-4">
          <label className="text-xs font-bold text-slate-500 ml-1">34. Qualifikationen - Studium und Weiterbildungen Aufzählung):</label>
          <textarea autoComplete="off" name="bio_qualifications" value={data.bio_qualifications} onChange={handleChange} className="w-full p-2 border rounded h-20" placeholder="Qualifikationen - Studium und Weiterbildungen Aufzählung):" />
        </div>
        <div className="flex flex-col gap-1 mt-4">
          <label className="text-xs font-bold text-slate-500 ml-1">35. Hobbys (Aufzählung):</label>
          <textarea autoComplete="off" name="bio_hobbies_list" value={data.bio_hobbies_list} onChange={handleChange} className="w-full p-2 border rounded h-20" placeholder="Hobbys (Aufzählung):" />
        </div>
        <div className="flex flex-col gap-1 mt-4">
          <label className="text-xs font-bold text-slate-500 ml-1">36. Gemeinsame Hobbys mit Partnerin in der Freizeit, besonders aber im Urlaub:</label>
          <textarea autoComplete="off" name="bio_shared_hobbies" value={data.bio_shared_hobbies} onChange={handleChange} className="w-full p-2 border rounded h-20" placeholder="Gemeinsame Hobbys mit Partnerin in der Freizeit, besonders aber im Urlaub:" />
        </div>
        <div className="flex flex-col gap-1 mt-4">
          <label className="text-xs font-bold text-slate-500 ml-1">37. sonstiges:</label>
          <input autoComplete="off" name="bio_other" value={data.bio_other} onChange={handleChange} className="w-full p-2 border rounded" placeholder="sonstiges:" />
        </div>

        <SectionTitle>D) Charakter</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 ml-1">38. In 3 Worten beschreiben:</label>
            <input autoComplete="off" name="personality_3words" value={data.personality_3words} onChange={handleChange} className="p-2 border rounded" placeholder="In 3 Worten beschreiben" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 ml-1">39. Was war typisch?:</label>
            <input autoComplete="off" name="personality_typical" value={data.personality_typical} onChange={handleChange} className="p-2 border rounded" placeholder="Was war typisch?" />
          </div>
        </div>
        <div className="flex flex-col gap-1 mt-4">
          <label className="text-xs font-bold text-slate-500 ml-1">40. Charaktereigenschaften & Wesenszüge:</label>
          <textarea autoComplete="off" name="personality_traits" value={data.personality_traits} onChange={handleChange} className="w-full p-2 border rounded h-20" placeholder="Charaktereigenschaften & Wesenszüge:" />
        </div>
        <div className="flex flex-col gap-1 mt-4">
          <label className="text-xs font-bold text-slate-500 ml-1">41. Was glücklich machte / Glücksmomente:</label>
          <textarea autoComplete="off" name="personality_happy" value={data.personality_happy} onChange={handleChange} className="w-full p-2 border rounded h-20" placeholder="Was glücklich machte / Glücksmomente:" />
        </div>
        <div className="flex flex-col gap-1 mt-4">
          <label className="text-xs font-bold text-slate-500 ml-1">42. Wohlfühlorte - wo fühlte Er/Sie sich besonders hingezogen?:</label>
          <textarea autoComplete="off" name="personality_wellbeing_places" value={data.personality_wellbeing_places} onChange={handleChange} className="w-full p-2 border rounded h-20" placeholder="Wohlfühlorte - wo fühlte Er/Sie sich besonders hingezogen?" />
        </div>

        <SectionTitle>E) Werte & Abschluss</SectionTitle>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-500 ml-1">43. Werte und Meilensteine des Lebens, d.h. wo ist Er/Sie nach eigener Einschätzung über sich selbst stolz gewesen, welche Projekte/Tätigkeiten oder Leistungen waren es?:</label>
          <textarea autoComplete="off" name="values_milestones" value={data.values_milestones} onChange={handleChange} className="w-full p-2 border rounded h-24" placeholder="Werte und Meilensteine des Lebens, d.h. wo ist Er/Sie nach eigener Einschätzung über sich selbst stolz gewesen, welche Projekte/Tätigkeiten oder Leistungen waren es?:" />
        </div>
        <div className="flex flex-col gap-1 mt-4">
          <label className="text-xs font-bold text-slate-500 ml-1">44. Freunde bzw. welche Kontakte pflegte Er/Sie in den letzten Jahren (Klassen- und Vereinstreffen, einzelne Freunde/Kollegen)?:</label>
          <textarea autoComplete="off" name="friends_contacts" value={data.friends_contacts} onChange={handleChange} className="w-full p-2 border rounded h-20" placeholder="Freunde bzw. welche Kontakte pflegte Er/Sie in den letzten Jahren (Klassen- und Vereinstreffen, einzelne Freunde/Kollegen)?:" />
        </div>
        <div className="flex flex-col gap-1 mt-4">
          <label className="text-xs font-bold text-slate-500 ml-1">45. Welche Krisen durchlebte Er/Sie im Leben (Arbeitlosigkeit, Krankheit) und wie bewältigte Er/Sie diese Lebensabschnitte?:</label>
          <textarea autoComplete="off" name="crises_handling" value={data.crises_handling} onChange={handleChange} className="w-full p-2 border rounded h-20" placeholder="Welche Krisen durchlebte Er/Sie im Leben (Arbeitlosigkeit, Krankheit) und wie bewältigte Er/Sie diese Lebensabschnitte?:" />
        </div>
        <div className="flex flex-col gap-1 mt-4">
          <label className="text-xs font-bold text-slate-500 ml-1">46. Krankheit, Sterben, Abschied (Sensibel):</label>
          <textarea autoComplete="off" name="illness_death" value={data.illness_death} onChange={handleChange} className="w-full p-2 border rounded h-20" placeholder="Krankheit, Sterben, Abschied (Sensibel):" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 ml-1">47. Was soll unbedingt vorkommen in der Rede?:</label>
            <textarea autoComplete="off" name="speech_must_haves" value={data.speech_must_haves} onChange={handleChange} className="p-2 border rounded h-24" placeholder="Was soll unbedingt vorkommen in der Rede?:" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 ml-1">48. Was soll auf KEINEN FALL erwähnt werden Tabus)!:</label>
            <textarea autoComplete="off" name="speech_taboos" value={data.speech_taboos} onChange={handleChange} className="p-2 border rounded h-24" placeholder="Was soll auf KEINEN FALL erwähnt werden Tabus)!:" />
          </div>
        </div>
        <div className="flex flex-col gap-1 mt-4">
          <label className="text-xs font-bold text-slate-500 ml-1">49. Danksagungen und zu nennende Namen:</label>
          <textarea autoComplete="off" name="thanks_names" value={data.thanks_names} onChange={handleChange} className="w-full p-2 border rounded h-20" placeholder="Danksagungen und zu nennende Namen:" />
        </div>

        <SectionTitle>F) Ergänzungen</SectionTitle>
        <p className="text-sm text-slate-600 mb-2 italic">
          Hier können Sie manuelle Bemerkungen unter Angabe der jeweiligen Feldnummer als persönliche Notiz beim Erfassungsgespräch beim Kunden vornehmen. Diese Notizen stellen eine Ergänzung dar und dienen Ihnen bei der maschinellen Erfassung der Frageliste als Hilfestellung.
        </p>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-500 ml-1">50. Ergänzungen:</label>
          <textarea autoComplete="off" name="additional_notes" value={data.additional_notes} onChange={handleChange} className="w-full p-2 border rounded h-32" placeholder="Persönliche Notizen..." />
        </div>

        <div className="flex justify-between items-center pt-4">
          <button 
            onClick={handleSaveAndExport}
            className="bg-white text-slate-700 border border-slate-300 px-6 py-3 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Ausgefüllte Frageliste speichern und ausdrucken!
          </button>
          <button onClick={onNext} className="bg-slate-900 text-white px-8 py-3 rounded-lg hover:bg-slate-800 transition-colors shadow-md">
            Weiter zu Schritt 2
          </button>
        </div>

        <ResetButton onReset={onReset} />
      </div>
    </div>
  );
};

const StyleSelection = ({ state, setState, onNext, onReset }: { state: AppState, setState: (s: AppState) => void, onNext: () => void, onReset: () => void }) => {
  const isDemo = state.version === 'demo';

  const toggleTone = (tone: SpeechTone) => {
    if (isDemo) {
      setState({ ...state, tones: [tone] });
      return;
    }

    const isSelected = state.tones.includes(tone);
    if (isSelected) {
      setState({ ...state, tones: state.tones.filter(t => t !== tone) });
    } else if (state.tones.length < 3) {
      setState({ ...state, tones: [...state.tones, tone] });
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg my-10 border border-slate-200">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm">2</span>
        Stil & Rahmen
      </h2>

      <div className="space-y-8">
        <div>
          <label className="block text-lg font-semibold text-slate-800 mb-4">Prägung der Zeremonie</label>
          <div className="grid grid-cols-2 gap-4">
            <button 
              disabled={isDemo}
              onClick={() => setState({ ...state, religiousContext: 'kirchlich' })}
              className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center relative ${state.religiousContext === 'kirchlich' ? 'border-purple-600 bg-purple-50' : 'border-slate-100 hover:border-slate-300'} ${isDemo ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <span className="font-bold">Kirchlich</span>
              {isDemo && <span className="text-[10px] text-amber-600 mt-2 font-medium">nur in Vollversion verfügbar</span>}
            </button>
            <button 
              onClick={() => setState({ ...state, religiousContext: 'nicht-kirchlich' })}
              className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center ${state.religiousContext === 'nicht-kirchlich' ? 'border-purple-600 bg-purple-50' : 'border-slate-100 hover:border-slate-300'}`}
            >
              <span className="font-bold">Weltlich / Neutral</span>
            </button>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-lg font-semibold text-slate-800">Tonalität der Rede</label>
            {!isDemo && (
              <span className="text-sm text-slate-500 font-medium">
                {state.tones.length} von 3 ausgewählt
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.values(SpeechTone).map((tone) => {
              const isToneRestricted = isDemo && tone !== SpeechTone.AUFGELOCKERT;
              const isSelected = state.tones.includes(tone);
              return (
                <button 
                  key={tone}
                  disabled={isToneRestricted}
                  onClick={() => toggleTone(tone)}
                  className={`p-4 rounded-lg border text-left transition-all flex flex-col relative ${isSelected ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'} ${isToneRestricted ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-medium">{tone}</span>
                    {isSelected && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {isToneRestricted && <span className={`text-[10px] mt-1 ${isSelected ? 'text-purple-200' : 'text-amber-600'}`}>nur in Vollversion verfügbar</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <button onClick={() => setState({...state, step: 'interview'})} className="text-slate-500 hover:text-slate-700">Zurück</button>
          <button 
            disabled={state.tones.length === 0}
            onClick={onNext} 
            className={`bg-slate-900 text-white px-8 py-3 rounded-lg transition-colors shadow-md ${state.tones.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'}`}
          >
            {state.tones.length > 1 ? `Alle ${state.tones.length} Reden generieren` : 'Ausführliche Rede generieren'}
          </button>
        </div>

        <ResetButton onReset={onReset} />
      </div>
    </div>
  );
};

const SpeechBuilder = ({ state, onUpdateOutline, onRestart, onReset }: { state: AppState, onUpdateOutline: (tone: SpeechTone, o: SpeechSection[]) => void, onRestart: () => void, onReset: () => void }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTone, setActiveTone] = useState<SpeechTone>(state.tones[0]);
  const [exportFormat, setExportFormat] = useState<'word' | 'pdf'>('word');

  const activeOutline = state.outlines.find(o => o.tone === activeTone)?.sections || [];

  const handleEdit = (id: string, newContent: string) => {
    const newSections = activeOutline.map(s => s.id === id ? { ...s, content: newContent } : s);
    onUpdateOutline(activeTone, newSections);
  };

  const exportToWord = (toneToExport?: SpeechTone) => {
    const targetTone = toneToExport || activeTone;
    const targetOutline = state.outlines.find(o => o.tone === targetTone)?.sections || [];
    
    const title = `Grabrede für ${state.interview.deceasedName} (${targetTone})`;
    const date = new Date().toLocaleDateString();
    const isDemo = state.version === 'demo';
    
    // HTML wrapper with Word-specific CSS and XML for page numbering
    const htmlHeader = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <style>
          @page WordSection1 {
            size: 595.3pt 841.9pt;
            margin: 70.85pt 70.85pt 70.85pt 70.85pt;
            mso-header-margin: 35.4pt;
            mso-footer-margin: 35.4pt;
            mso-footer: f1;
          }
          div.WordSection1 { page: WordSection1; }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 20pt; 
            mso-line-height-rule: exactly;
            line-height: 40pt; 
          }
          h1 { 
            font-family: Arial, sans-serif;
            font-size: 26pt; 
            font-weight: bold; 
            margin-bottom: 20pt; 
            text-align: center; 
            line-height: 1.2;
          }
          h2 { 
            font-family: Arial, sans-serif;
            font-size: 22pt; 
            font-weight: bold; 
            margin-top: 20pt; 
            border-bottom: 1px solid #ccc; 
            line-height: 1.2;
          }
          p { 
            font-family: Arial, sans-serif;
            font-size: 20pt;
            margin-bottom: 12pt; 
            text-align: justify; 
            mso-line-height-rule: exactly;
            line-height: 40pt;
          }
          .quote { 
            font-family: Arial, sans-serif;
            font-size: 20pt;
            font-style: italic; 
            text-align: center; 
            margin: 30pt 0; 
            color: #444; 
            mso-line-height-rule: exactly;
            line-height: 40pt;
          }
          table { width: 100%; border-collapse: collapse; }
          /* Page Numbering style for Word footer */
          p.MsoFooter {
            margin: 0in;
            text-align: center;
            font-family: Arial, sans-serif;
            font-size: 12pt;
          }
          /* Demo restriction: hide content after page 4 for printing */
          @media print {
            .demo-limit { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="WordSection1">
          <h1>${title}</h1>
          <p><i>Erstellt am ${date}</i></p>
    `;

    const sectionsHtml = targetOutline
      .filter((_, idx) => !isDemo || idx === 0)
      .map((s, index) => {
        const sectionHtml = `
          <h2>${s.title}</h2>
          <p>${s.content.replace(/\n/g, '</p><p>')}</p>
        `;
        return sectionHtml;
      }).join('');

    // XML for Word page numbering in footer
    const htmlFooter = `
        <div style='mso-element:footer' id=f1>
          <p class=MsoFooter style='text-align: center; font-family: Arial, sans-serif; font-size: 12pt;'>
            <span style='mso-no-proof:yes'>
              <span style='mso-field-code:" PAGE "'></span>
            </span>
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    // Construct final HTML
    let finalSectionsHtml = sectionsHtml;

    // For demo, we add a message at the end
    if (isDemo) {
      finalSectionsHtml += `
        <div class="demo-limit" style="margin-top: 20pt; padding: 20pt; border: 1px solid #eee; font-family: Arial, sans-serif;">
          <p style="color: red; font-weight: bold; font-size: 14pt; margin-bottom: 10pt;">Demo Version</p>
          <div style="color: black; font-size: 12pt; line-height: 1.6;">
            <p style="font-weight: bold; margin-bottom: 5pt;">Die Abschnitte:</p>
            <ul style="margin-left: 20pt; margin-bottom: 10pt;">
              <li>Lebensrückblick</li>
              <li>Der Mensch hinter den Daten</li>
              <li>Hobbys, Leidenschaft & Kleine Freuden</li>
              <li>Werte, Spuren & Vermächtnis</li>
              <li>Persönliche Anekdote & Würdigung</li>
              <li>Trostgedanken & letzter Abschied</li>
              <li>Schlusswort & Dank</li>
            </ul>
          </div>
          <p style="color: red; font-weight: bold; font-size: 12pt; margin-top: 10pt;">werden nicht in der Demo Version erstellt und angezeigt.</p>
          
          <p style="color: red; font-weight: bold; font-size: 14pt; margin-top: 20pt; margin-bottom: 10pt;">ENDE DER DEMO-AUSGABE.</p>
          <p style="color: black; font-weight: bold; font-size: 12pt; margin-bottom: 10pt;">Mit der Vollversion erhalten Sie:</p>
          
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc; font-size: 10pt;">
            <thead>
              <tr style="background-color: #f9f9f9;">
                <th style="border: 1px solid #ccc; padding: 8pt; text-align: left;">Vorteil</th>
                <th style="border: 1px solid #ccc; padding: 8pt; text-align: left;">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ccc; padding: 8pt; font-weight: bold;">Vollständiger Ausdruck</td>
                <td style="border: 1px solid #ccc; padding: 8pt;">Keine Seitenbeschränkung, voller Textumfang.</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ccc; padding: 8pt; font-weight: bold;">Zeremonie-Auswahl</td>
                <td style="border: 1px solid #ccc; padding: 8pt;">Wahl zwischen Kirchlich und Weltlich / Neutral.</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ccc; padding: 8pt; font-weight: bold;">6 Tonalitäten</td>
                <td style="border: 1px solid #ccc; padding: 8pt;">
                  1. Aufgelockert & Feiernd<br/>
                  2. Traurig & Mitfühlend<br/>
                  3. Formal & Würdevoll<br/>
                  4. Poetisch & Philosophisch<br/>
                  5. Kirchlich/Religiös geprägt<br/>
                  6. Nicht-kirchlich/Weltlich
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #ccc; padding: 8pt; font-weight: bold;">Multi-Export</td>
                <td style="border: 1px solid #ccc; padding: 8pt;">Erstellung von 3 Reden mit verschiedenen Tonalitäten gleichzeitig.</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ccc; padding: 8pt; font-weight: bold;">Klassiker-Zitate</td>
                <td style="border: 1px solid #ccc; padding: 8pt;">In jeder Rede erscheinen 2 Klassiker Zitate mit Namensnennung.</td>
              </tr>
            </tbody>
          </table>
          <p style="color: #666; font-style: italic; font-size: 10pt; margin-top: 10pt;">Hinweis: In der Vollversion können Sie alle Funktionen uneingeschränkt nutzen.</p>
        </div>
      `;
    }

    const fullHtml = htmlHeader + finalSectionsHtml + htmlFooter;
    const blob = new Blob([fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Grabrede_${state.interview.deceasedName.replace(/\s/g, '_')}_${targetTone}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const title = `Trauerrede - ${state.interview.deceasedName}`;
    const date = new Date().toLocaleDateString();
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text(title, 105, 20, { align: 'center' });
    
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(12);
    doc.text(`Erstellt am ${date}`, 105, 30, { align: 'center' });
    
    let y = 45;
    const margin = 20;
    const pageWidth = 210;
    const contentWidth = pageWidth - (2 * margin);
    
    activeOutline.forEach((section) => {
      if (state.version === 'demo' && activeOutline.indexOf(section) > 0) return;
      
      // Check for page break
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(section.title, margin, y);
      y += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14); // Arial 20 equivalent in PDF is roughly 14-16pt depending on scale, but user asked for Arial 20. 
      // In PDF 1pt = 1/72 inch. In Word 1pt = 1/72 inch. So 20pt is 20pt.
      doc.setFontSize(20); 
      
      const lines = doc.splitTextToSize(section.content, contentWidth);
      lines.forEach((line: string) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin, y);
        y += 10; // Line height
      });
      
      y += 15; // Section spacing
    });
    
    if (state.version === 'demo') {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 0, 0);
      doc.setFontSize(14);
      doc.text('Demo Version - Gekürzter Entwurf', margin, y);
    }
    
    doc.save(`Grabrede_${state.interview.deceasedName.replace(/\s/g, '_')}_${activeTone}.pdf`);
  };

  if (state.isGenerating) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center space-y-8">
        <div className="relative inline-block">
          <div className="animate-spin rounded-full h-24 w-24 border-4 border-slate-200 border-t-slate-900"></div>
          <div className="absolute inset-0 flex items-center justify-center font-bold text-lg">
            {state.generationProgress}%
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-2xl font-bold italic">Ein tiefgründiger Entwurf wird gewebt...</h2>
          <div className="w-full bg-slate-200 rounded-full h-4 max-w-md mx-auto overflow-hidden">
            <div 
              className="bg-slate-900 h-full transition-all duration-500 ease-out"
              style={{ width: `${state.generationProgress}%` }}
            ></div>
          </div>
          <p className="text-slate-500">Wir erstellen {state.tones.length > 1 ? `${state.tones.length} verschiedene Reden` : 'eine ausführliche Rede'} basierend auf Ihrem Leitfaden.</p>
          <p className="text-slate-400 text-sm italic">Das kann je nach Umfang und Rechnerleistung zwischen 3 und 10 Minuten dauern!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold">Ihre Trauerrede</h2>
          {state.version === 'full' && (
            <div className="mt-2">
              <p className="font-bold text-slate-900">Vorschau</p>
              <p className="text-slate-600 text-sm">Hier können Sie vor der Erstellung der jeweiligen Word-Datei Ihren Text korrigieren</p>
            </div>
          )}
          {state.version === 'demo' && (
            <p className="text-amber-600 text-sm font-medium mt-1">
              Demo-Version: Gekürzter Entwurf. Für volle Länge bitte Vollversion nutzen.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {state.tones.length > 1 && state.version === 'full' && (
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {state.tones.map(tone => (
                <button
                  key={tone}
                  onClick={() => setActiveTone(tone)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTone === tone ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {tone.split(' ')[0]}
                </button>
              ))}
            </div>
          )}
          
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setExportFormat('word')}
              className={`px-3 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${exportFormat === 'word' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
            >
              Word
            </button>
            <button
              onClick={() => setExportFormat('pdf')}
              className={`px-3 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${exportFormat === 'pdf' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}
            >
              PDF
            </button>
          </div>

          <button 
            onClick={() => exportFormat === 'word' ? exportToWord() : exportToPDF()}
            className={`${exportFormat === 'word' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 font-bold transition-colors`}
          >
            {exportFormat === 'word' ? (
              <>
                <FileText className="h-5 w-5" />
                Word-Export (Arial 20)
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                PDF-Export (Arial 20)
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {activeOutline
          .filter((_, idx) => state.version === 'full' || idx === 0)
          .map((section) => (
          <div key={section.id} className="bg-white rounded-xl shadow border border-slate-100 overflow-hidden">
            <div 
              className="bg-slate-50 p-4 font-bold border-b flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={() => setEditingId(editingId === section.id ? null : section.id)}
            >
              <h3 className="text-slate-800">{section.title}</h3>
              <div className="flex items-center gap-2">
                <span className="text-blue-600 text-xs font-medium uppercase tracking-wider">Bearbeiten</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-slate-400 transition-transform ${editingId === section.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="p-6">
              {editingId === section.id ? (
                <textarea 
                  className="w-full h-96 p-4 border rounded font-serif text-lg leading-relaxed focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={section.content}
                  onChange={(e) => handleEdit(section.id, e.target.value)}
                />
              ) : (
                <div className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-slate-700">
                  {section.content}
                </div>
              )}
            </div>
          </div>
        ))}

        {state.version === 'demo' && (
          <div className="bg-white p-8 rounded-xl shadow border border-slate-100 space-y-4">
            <p className="text-red-600 font-bold text-lg">Demo Version</p>
            <div className="text-slate-900 space-y-1">
              <p className="font-medium">Die Abschnitte:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Lebensrückblick</li>
                <li>Der Mensch hinter den Daten</li>
                <li>Hobbys, Leidenschaft & Kleine Freuden</li>
                <li>Werte, Spuren & Vermächtnis</li>
                <li>Persönliche Anekdote & Würdigung</li>
                <li>Trostgedanken & letzter Abschied</li>
                <li>Schlusswort & Dank</li>
              </ul>
            </div>
            <p className="text-red-600 font-bold">werden nicht in der Demo Version erstellt und angezeigt.</p>
            
            <div className="mt-10 pt-10 border-t border-slate-100">
              <p className="text-slate-900 font-bold mb-6">Mit der Vollversion erhalten Sie:</p>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-200 text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border border-slate-200 p-3 text-left font-bold">Vorteil</th>
                      <th className="border border-slate-200 p-3 text-left font-bold">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-200 p-3 font-bold">Vollständiger Ausdruck</td>
                      <td className="border border-slate-200 p-3">Keine Seitenbeschränkung, voller Textumfang.</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 p-3 font-bold">Zeremonie-Auswahl</td>
                      <td className="border border-slate-200 p-3">Wahl zwischen Kirchlich und Weltlich / Neutral.</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 p-3 font-bold">6 Tonalitäten</td>
                      <td className="border border-slate-200 p-3">
                        1. Aufgelockert & Feiernd<br/>
                        2. Traurig & Mitfühlend<br/>
                        3. Formal & Würdevoll<br/>
                        4. Poetisch & Philosophisch<br/>
                        5. Kirchlich/Religiös geprägt<br/>
                        6. Nicht-kirchlich/Weltlich
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 p-3 font-bold">Multi-Export</td>
                      <td className="border border-slate-200 p-3">Erstellung von 3 Reden mit verschiedenen Tonalitäten gleichzeitig.</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 p-3 font-bold">Klassiker-Zitate</td>
                      <td className="border border-slate-200 p-3">In jeder Rede erscheinen 2 Klassiker Zitate mit Namensnennung.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-6 text-slate-600 italic">Hinweis: In der Vollversion können Sie alle Funktionen uneingeschränkt nutzen.</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 text-center">
        <button 
          onClick={() => onRestart()} 
          className="text-slate-600 hover:text-slate-900 font-bold underline decoration-slate-300 underline-offset-4 transition-all"
        >
          Zurück zur umfassenden Frageliste (Leitfaden A-F)
        </button>
      </div>

      <ResetButton onReset={onReset} />
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [state, setState] = useState<AppState>({
    step: 'login',
    version: null,
    interview: INITIAL_INTERVIEW,
    religiousContext: 'nicht-kirchlich',
    tones: [],
    outlines: [],
    isGenerating: false,
    generationProgress: 0
  });

  const handleStartGeneration = async () => {
    setState(prev => ({ ...prev, step: 'generation', isGenerating: true, generationProgress: 0 }));
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setState(prev => {
        if (prev.generationProgress >= 95) return prev;
        return { ...prev, generationProgress: prev.generationProgress + 1 };
      });
    }, 500);

    const newOutlines: { tone: SpeechTone; sections: SpeechSection[] }[] = [];
    
    try {
      // Generate each tone sequentially
      for (const tone of state.tones) {
        const sections = await generateSpeechOutline(state.interview, state.religiousContext, tone, state.version);
        newOutlines.push({ tone, sections });
      }
      
      clearInterval(progressInterval);
      setState(prev => ({ ...prev, outlines: newOutlines, isGenerating: false, generationProgress: 100 }));
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Generation failed', error);
      alert('Die Generierung ist fehlgeschlagen. Bitte versuchen Sie es erneut.');
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const handleUpdateOutline = (tone: SpeechTone, sections: SpeechSection[]) => {
    setState(prev => ({
      ...prev,
      outlines: prev.outlines.map(o => o.tone === tone ? { ...o, sections } : o)
    }));
  };

  const handleLogin = (version: 'demo' | 'full') => {
    // Auto-save previous data if exists before starting new session
    if (state.interview.deceasedName) {
      exportInterviewToWord(state.interview);
    }
    setState(prev => ({ 
      ...prev, 
      step: 'menu', 
      version,
      interview: INITIAL_INTERVIEW,
      tones: version === 'demo' ? [SpeechTone.AUFGELOCKERT] : []
    }));
  };

  const handleLogout = () => {
    if (state.interview.deceasedName) {
      exportInterviewToWord(state.interview);
    }
    setState({...state, step: 'login', version: null, interview: INITIAL_INTERVIEW, tones: [], outlines: []});
  };

  const handleReset = () => {
    if (state.interview.deceasedName) {
      exportInterviewToWord(state.interview);
    }
    setState({...state, step: 'login', version: null, interview: INITIAL_INTERVIEW, tones: [], outlines: []});
  };

  const handleShareApp = async () => {
    const shareData = {
      title: 'Trauerredner Pro',
      text: 'Würdevolle Worte für den letzten Abschied - Professionelle Trauerreden erstellen.',
      url: window.location.origin,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Sharing failed', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.origin);
        alert('Link wurde in die Zwischenablage kopiert!');
      } catch (err) {
        console.error('Clipboard failed', err);
      }
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      <Header onShare={handleShareApp} />
      <main className="container mx-auto px-4">
        {state.step === 'login' && <Login onLogin={handleLogin} />}
        {state.step === 'menu' && <MainMenu onNavigate={(step) => setState({ ...state, step })} version={state.version} onLogout={handleLogout} />}
        {state.step === 'interview' && <InterviewForm data={state.interview} onChange={(d) => setState({ ...state, interview: d })} onNext={() => setState({...state, step: 'style'})} onReset={handleReset} version={state.version} />}
        {state.step === 'style' && <StyleSelection state={state} setState={setState} onNext={handleStartGeneration} onReset={handleReset} />}
        {state.step === 'generation' && (
          <SpeechBuilder 
            state={state} 
            onUpdateOutline={handleUpdateOutline} 
            onRestart={() => setState(prev => ({ ...prev, step: 'interview' }))} 
            onReset={handleReset} 
          />
        )}
      </main>
    </div>
  );
}
