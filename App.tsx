import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

// API Initialisierung
const ai = new GoogleGenAI({ 
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" 
});

export default function App() {
  // States für Login & Navigation
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDemo, setIsDemo] = useState(false); 
  const [view, setView] = useState("dashboard"); 
  const [activeTab, setActiveTab] = useState("content");

  // States für Inhalte (Felder standardmäßig komplett leer)
  const [title, setTitle] = useState("");
  const [extraHints, setExtraHints] = useState("");
  const [authorData, setAuthorData] = useState({
    name: "",
    firma: "",
    strasse: "",
    plzOrt: "",
    email: "",
    web: ""
  });

  // States für die Generierung
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState("");
  
  // States für Strukturen, Inhalte und das Cover-Bild
  const [outlineTitles, setOutlineTitles] = useState<string[]>([]);
  const [chapters, setChapters] = useState<{title: string, content: string, estimatedPages: number}[]>([]);
  
  // Ein schönes, neutrales Platzhalter-Standardbild
  const [coverImageUrl, setCoverImageUrl] = useState("https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80");

  const handleLogin = () => {
    if (password === "913F6") {
      setIsLoggedIn(true);
      setIsDemo(false);
    } else if (password === "913F7") {
      setIsLoggedIn(true);
      setIsDemo(true);
      setExtraHints("Nur in der Vollversion verfügbar");
      setAuthorData({
        name: "Nur in der Vollversion verfügbar",
        firma: "Nur in der Vollversion verfügbar",
        strasse: "Nur in der Vollversion verfügbar",
        plzOrt: "Nur in der Vollversion verfügbar",
        email: "Nur in der Vollversion verfügbar",
        web: "Nur in der Vollversion verfügbar"
      });
    } else {
      alert("Ungültiges Passwort für den KI Freebie Generator!");
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') handleLogin();
  };

  const generateEbook = async () => {
    if (!title) return alert("Bitte einen Buchtitel eingeben!");
    setLoading(true);
    setProgress(5);
    setChapters([]);
    setOutlineTitles([]);
    
    try {
      setLoadingStatus("Erstelle Buchstruktur...");
      const outlineResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Du bist ein Buch-Struktur-Assistent. Erstelle eine präzise Liste von exakt 12 logischen Kapiteltiteln für ein Buch mit dem Titel "${title}". Antworte NUR mit den Titeln untereinander (ohne Zahlen/Striche), ein Titel pro Zeile. Keine Einleitung, kein Fazit.`,
      });
      
      const responseText = outlineResponse.text || "";
      const lines = responseText.split('\n').map(line => line.trim());
      
      const fullOutline = lines
        .filter(line => line.length > 3)
        .map(line => line.replace(/^[0-9\.\-\#\*\s\•]+/, '').trim())
        .slice(0, 12);

      while(fullOutline.length < 12) {
        fullOutline.push(`Vertiefung Thema Teil ${fullOutline.length + 1}`);
      }
      
      setOutlineTitles(fullOutline);
      setProgress(15);

      const textChapterCount = isDemo ? 2 : 12;
      let tempChapters: any[] = [];
      
      for (let i = 0; i < textChapterCount; i++) {
        const cTitle = fullOutline[i];
        setLoadingStatus(`Schreibe Kapitel ${i + 1} von ${textChapterCount}: "${cTitle}"...`);
        
        const chapterResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Schreibe das ausführliche Kapitel "${cTitle}" für das Buch "${title}". Format: HTML <p>-Tags für Absätze verwenden. Nutze absolut KEIN Markdown (keine Sternchen, keine Rauten).`,
        });

        let cleanHtml = (chapterResponse.text || "").replace(/```html/gi, '').replace(/```/g, '').trim();
        const wordCount = cleanHtml.split(/\s+/).length;
        const estimatedPages = Math.max(1, Math.ceil(wordCount / 260));

        tempChapters.push({
          title: cTitle,
          content: cleanHtml.length > 15 ? cleanHtml : "<p>Inhalt wird geladen...</p>",
          estimatedPages: estimatedPages
        });
        setProgress(15 + Math.round(((i + 1) / textChapterCount) * 85));
      }
      
      setChapters(tempChapters);
      setView("preview");
    } catch (error: any) { 
      alert("Fehler bei der Generierung: " + error.message); 
    } finally { 
      setLoading(false); 
      setProgress(0); 
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setCoverImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadWordDocx = (e: React.MouseEvent) => {
    e.preventDefault();
    const renderArea = document.getElementById("ebook-render-area");
    if (!renderArea) return alert("Fehler beim Exportieren: Dokumenten-Inhalt nicht gefunden.");

    const clonedArea = renderArea.cloneNode(true) as HTMLElement;
    clonedArea.querySelectorAll('.no-docx-export').forEach(el => el.remove());

    const htmlContent = clonedArea.innerHTML;

    const docxHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #000000; }
          h1 { font-size: 28pt; color: #1e40af; text-align: center; margin-top: 50px; font-weight: bold; }
          h2 { font-size: 18pt; color: #1e40af; border-bottom: 2px solid #1e40af; margin-top: 30px; margin-bottom: 15px; font-weight: bold; padding-bottom: 5px; }
          .ch-num { margin-right: 12px; color: #1e40af; }
          p { font-size: 11.5pt; text-align: justify; margin-bottom: 12px; }
          .toc-item { font-size: 12pt; margin-bottom: 8px; }
          .page-footer { text-align: center; font-size: 10pt; color: #94a3b8; }
          img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + docxHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, "_") || "Premium_Ratgeber"}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPdf = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDemo) return;
    window.print();
  };

  const handleGoBack = (e: React.MouseEvent) => {
    e.preventDefault();
    setView("dashboard");
  };

  const getChapterPageNumber = (index: number) => {
    let startPage = 3; 
    for (let i = 0; i < Math.min(index, chapters.length); i++) {
      startPage += chapters[i].estimatedPages;
    }
    if (isDemo && index >= chapters.length) {
      startPage += (chapters[0]?.estimatedPages || 3) + (chapters[1]?.estimatedPages || 3);
      startPage += (index - 2) * 3;
    }
    return startPage;
  };

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
        <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-sm w-full text-center border-t-8 border-blue-700">
          <div className="flex items-center justify-center mb-4">
            <img src="/logo_startseite_300x300.png" alt="Pepe Logo" className="w-24 h-24 object-contain rounded-xl bg-white p-1 shadow-sm" />
          </div>
          <h1 className="text-3xl font-black text-gray-800 uppercase mb-0.5">Pepe Verlag</h1>
          <p className="text-base font-bold text-blue-700 uppercase mb-2">KI Freebie Generator</p>
          <input type="password" className="w-full border-2 rounded-xl p-4 mb-4 text-center text-black border-slate-200 focus:border-blue-600 font-medium outline-none" placeholder="Passwort eingeben" value={password} onChange={(e) => setPassword(e.target.value)} onKeyPress={handleKeyPress} autoFocus />
          <button onClick={handleLogin} className="w-full bg-blue-700 hover:bg-blue-800 text-white py-4 rounded-xl font-bold uppercase shadow-lg transition-all">Anmelden</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <style>{`
        .pdf-container { background-color: #64748b; padding: 30px 0; }
        .pdf-page {
          background: white; color: black; width: 210mm; min-height: 297mm;
          padding: 25mm 20mm 35mm 20mm; margin: 0 auto 20px auto;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3); box-sizing: border-box;
          position: relative; page-break-inside: avoid; page-break-after: auto;
        }
        .chapter-block { page-break-before: always; break-before: page; }
        
        .pdf-page h2 { 
          font-size: 18pt; color: #1e40af; border-bottom: 2px solid #1e40af; 
          margin-top: 5mm; margin-bottom: 22px; font-weight: bold; padding-bottom: 6px;
          page-break-after: avoid; break-after: avoid;
          display: flex; align-items: tracking;
        }
        .ch-num { margin-right: 12px; font-weight: bold; color: #1e40af; display: inline-block; }
        
        .pdf-page p { font-size: 11.5pt; line-height: 1.65; margin-bottom: 16px; text-align: justify; }
        .page-content-wrapper { padding-bottom: 20mm; box-sizing: border-box; }
        .page-footer {
          position: absolute; bottom: 12mm; left: 20mm; right: 20mm;
          text-align: center; font-size: 10pt; color: #94a3b8;
          border-top: 1px solid #e2e8f0; padding-top: 5px; background: white;
        }
        .toc-item { display: flex; align-items: flex-end; margin-bottom: 12px; font-size: 12pt; }
        .toc-item .ch-num { margin-right: 8px; }
        .toc-dots { flex-grow: 1; border-bottom: 2px dotted #cbd5e1; margin: 0 10px; position: relative; top: -4px; }
        .cover-page { height: 237mm; display: flex; flex-direction: column; justify-content: space-between; }
        .cover-hero-wrapper { position: relative; width: 100%; height: 380px; margin-bottom: 30px; }
        .cover-hero { width: 100%; height: 100%; object-fit: cover; border-radius: 15px; border: 1px solid #e2e8f0; }

        @media print {
          @page { size: A4 portrait; margin: 20mm 20mm 25mm 20mm; }
          body, html { background: white !important; color: black !important; }
          .no-print, header, .info-banner-editable, .no-docx-export { display: none !important; }
          .pdf-container { background: white !important; padding: 0 !important; }
          .pdf-page { box-shadow: none !important; margin: 0 !important; width: 100% !important; padding: 0 !important; min-height: auto !important; page-break-inside: avoid; }
          .page-content-wrapper { padding-bottom: 0 !important; }
          .page-footer { bottom: 0mm; left: 0; right: 0; }
        }
      `}</style>

      {/* HEADER */}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md sticky top-0 z-[9999] no-print">
        <div className="flex items-center gap-3">
          <img src="/logo_startseite_300x300.png" alt="Pepe Logo" className="w-9 h-9 object-contain rounded bg-white p-0.5 shadow-sm" />
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-lg text-white uppercase tracking-wide m-0 p-0">KI Freebie Generator</h2>
            {isDemo ? (
              <span className="bg-orange-500/20 text-orange-400 border border-orange-500/40 text-xs font-black px-2.5 py-1 rounded-md tracking-wider">DEMOVERSION</span>
            ) : (
              <span className="bg-green-500/20 text-green-400 border border-green-500/40 text-xs font-black px-2.5 py-1 rounded-md tracking-wider">VOLLVERSION</span>
            )}
          </div>
        </div>
        {view === "preview" && (
          <div className="flex gap-3">
            <button onClick={handleGoBack} className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2 rounded-xl font-bold text-sm uppercase">← Zurück</button>
            {isDemo ? (
              /* NEUER TEXT FÜR DIE DEMO-SPERRE */
              <span className="bg-orange-500/20 text-orange-400 border border-orange-500/40 px-6 py-2 rounded-xl font-black text-sm uppercase flex items-center shadow-inner tracking-wide select-none">
                🔒 Export in PDF und WORD gesperrt (nur Vollversion)
              </span>
            ) : (
              <>
                <button onClick={downloadWordDocx} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-black text-sm uppercase shadow-lg transition-all">📝 Word-Datei (.docx)</button>
                <button onClick={downloadPdf} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl font-black text-sm uppercase shadow-lg transition-all">🖨️ PDF drucken</button>
              </>
            )}
          </div>
        )}
      </header>

      {view === "dashboard" && (
        <div className="max-w-4xl mx-auto py-10 px-4">
          <div className="flex bg-white rounded-2xl shadow-md mb-8 overflow-hidden border border-slate-200">
            <button onClick={() => setActiveTab("content")} className={`flex-1 py-4 font-bold text-sm uppercase flex items-center justify-center gap-2 ${activeTab === 'content' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>📝 1. Buchtitel</button>
            <button onClick={() => setActiveTab("author")} className={`flex-1 py-4 font-bold text-sm uppercase flex items-center justify-center gap-2 ${activeTab === 'author' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>👤 2. Autor & Impressum</button>
            <button onClick={() => setActiveTab("generate")} className={`flex-1 py-4 font-bold text-sm uppercase flex items-center justify-center gap-2 ${activeTab === 'generate' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>⚙️ 3. Generieren</button>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
            {activeTab === "content" && (
              <div className="grid gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">📝 E-Book Titel eingeben</label>
                  <input className="w-full border-2 p-4 rounded-xl font-semibold text-lg text-black focus:border-blue-600 outline-none" placeholder="z.B. Die perfekte Bewässerung im Garten..." value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">💡 Besondere Hinweise für die KI</label>
                  <textarea className="w-full border-2 p-4 rounded-xl h-40 text-black outline-none focus:border-blue-600 resize-none font-medium disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed" placeholder="Welche Kernpunkte sollen im Inhalt vorkommen?" value={extraHints} onChange={(e) => !isDemo && setExtraHints(e.target.value)} disabled={isDemo} />
                </div>
                <button onClick={() => setActiveTab("author")} className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold uppercase shadow-md">Weiter zu Schritt 2 →</button>
              </div>
            )}
            {activeTab === "author" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">👤 Name des Autors</label>
                  <input className="w-full border-2 p-3 rounded-xl text-black focus:border-blue-600 outline-none disabled:bg-slate-100 disabled:text-slate-400" placeholder="Name eintragen..." value={authorData.name} onChange={(e) => !isDemo && setAuthorData({...authorData, name: e.target.value})} disabled={isDemo} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">🏢 Verlag / Firma</label>
                  <input className="w-full border-2 p-3 rounded-xl text-black focus:border-blue-600 outline-none disabled:bg-slate-100 disabled:text-slate-400" placeholder="Firma eintragen..." value={authorData.firma} onChange={(e) => !isDemo && setAuthorData({...authorData, firma: e.target.value})} disabled={isDemo} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">🌐 Webseite</label>
                  <input className="w-full border-2 p-3 rounded-xl text-black focus:border-blue-600 outline-none disabled:bg-slate-100 disabled:text-slate-400" placeholder="www.beispiel.de" value={authorData.web} onChange={(e) => !isDemo && setAuthorData({...authorData, web: e.target.value})} disabled={isDemo} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">📍 Straße & Hausnummer</label>
                  <input className="w-full border-2 p-3 rounded-xl text-black focus:border-blue-600 outline-none disabled:bg-slate-100 disabled:text-slate-400" placeholder="Musterstraße 12" value={authorData.strasse} onChange={(e) => !isDemo && setAuthorData({...authorData, strasse: e.target.value})} disabled={isDemo} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">📮 PLZ & Ort</label>
                  <input className="w-full border-2 p-3 rounded-xl text-black focus:border-blue-600 outline-none disabled:bg-slate-100 disabled:text-slate-400" placeholder="12345 Musterstadt" value={authorData.plzOrt} onChange={(e) => !isDemo && setAuthorData({...authorData, plzOrt: e.target.value})} disabled={isDemo} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">✉️ E-Mail Adresse</label>
                  <input className="w-full border-2 p-3 rounded-xl text-black focus:border-blue-600 outline-none disabled:bg-slate-100 disabled:text-slate-400" placeholder="info@beispiel.de" value={authorData.email} onChange={(e) => !isDemo && setAuthorData({...authorData, email: e.target.value})} disabled={isDemo} />
                </div>
                <button onClick={() => setActiveTab("generate")} className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold uppercase mt-4 shadow-md">Weiter zu Schritt 3 →</button>
              </div>
            )}
            {activeTab === "generate" && (
              <div className="text-center py-8">
                {loading ? (
                  <div className="max-w-md mx-auto">
                    <h4 className="font-bold text-blue-800 uppercase mb-2 animate-pulse">⚙️ {loadingStatus}</h4>
                    <div className="w-full bg-slate-100 h-5 rounded-full overflow-hidden border">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-700 h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-5xl mb-4">📚</div>
                    <h3 className="font-black text-xl uppercase text-slate-800 mb-4">{isDemo ? 'Demo-Generierung starten (2 Kapitel ausformuliert, 12 im Verzeichnis)' : 'Vollversion-Generierung starten (12 Kapitel komplett)'}</h3>
                    <button onClick={generateEbook} className="bg-green-600 hover:bg-green-700 text-white px-10 py-5 rounded-xl shadow-xl font-black text-xl uppercase tracking-wider">🚀 Jetzt Buch generieren</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENDER-PREVIEW */}
      {view === "preview" && (
        <div className="pdf-container">
          
          <div className="info-banner-editable max-w-[210mm] mx-auto mb-6 bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-xl shadow-sm no-print">
            <div className="flex gap-3 items-start">
              <span className="text-xl">💡</span>
              <div>
                <h4 className="font-bold text-blue-950 text-sm uppercase tracking-wide mb-0.5">Hinweis zur Bearbeitung</h4>
                <p className="text-blue-900 text-xs font-medium leading-relaxed m-0">
                  Sie können jeden Textabschnitt direkt in der Vorschau anklicken und editieren. Über das Feld unter dem Cover-Bild lässt sich ganz einfach ein eigenes Bild von Ihrem PC hochladen!
                </p>
              </div>
            </div>
          </div>

          <div id="ebook-render-area">
            
            {/* SEITE 1: COVER-PAGE WITH LOCAL FILE UPLOAD */}
            <div className="pdf-page">
              <div className="cover-page">
                <div className="text-center pt-[10mm]">
                  <div className="cover-hero-wrapper">
                    <img src={coverImageUrl} className="cover-hero" alt="Cover Visual" />
                  </div>
                  
                  <div className="no-print no-docx-export my-4 flex justify-center">
                    <label className="cursor-pointer bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs uppercase px-4 py-2 rounded-xl shadow-md transition-all">
                      🖼️ Bild vom PC hochladen
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>

                  <h1 className="text-5xl font-black text-blue-800 uppercase px-4 editable-area" contentEditable>{title}</h1>
                  <div className="w-24 h-2 bg-blue-800 mx-auto mt-6"></div>
                </div>
                <div className="text-center pb-4">
                  <p className="text-xl font-bold text-slate-600 uppercase tracking-wide">Premium Ratgeber</p>
                  <p className="text-sm text-slate-400 mt-2">Präsentiert von {authorData.name || "—"}</p>
                </div>
              </div>
            </div>

            {/* SEITE 2: INHALTSVERZEICHNIS */}
            <div className="pdf-page chapter-block">
              <div className="page-content-wrapper">
                <h2 className="uppercase tracking-wide">Inhaltsverzeichnis</h2>
                <div className="mt-10 px-2">
                  {outlineTitles.map((chTitle, idx) => {
                    const isRealContentAvailable = idx < chapters.length;
                    return (
                      <div key={idx} className={`toc-item ${!isRealContentAvailable ? 'opacity-60 italic select-none' : ''}`}>
                        <span className="ch-num">{idx + 1}.</span>
                        <span className="font-medium text-slate-700 flex-1 editable-area" contentEditable={isRealContentAvailable}>{chTitle}</span>
                        <span className="toc-dots"></span>
                        <span className="font-bold text-slate-500 whitespace-nowrap">Seite {getChapterPageNumber(idx)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="page-footer">Seite 2</div>
            </div>

            {/* DIE GENERIERTEN KAPITELSEITEN */}
            {chapters.map((ch, idx) => (
              <div key={idx} className="pdf-page chapter-block">
                <div className="page-content-wrapper">
                  <h2 className="editable-area" contentEditable>
                    <span className="ch-num">{idx + 1}.</span>
                    <span>{ch.title}</span>
                  </h2>
                  <div className="editable-area text-justify mt-6" contentEditable dangerouslySetInnerHTML={{ __html: ch.content }} />
                </div>
                <div className="page-footer">Seite {getChapterPageNumber(idx)}</div>
              </div>
            ))}

            {/* DEMO PAYWALL MIT AUFFÄLLIGEM LINK */}
            {isDemo && (
              <div className="pdf-page chapter-block flex items-center justify-center bg-amber-50 no-docx-export">
                <div className="text-center p-8 border-4 border-dashed border-orange-400 rounded-2xl max-w-lg">
                  <span className="text-5xl block mb-4">🔒</span>
                  <h3 className="text-2xl font-black text-slate-800 uppercase mb-2">Weitere Kapitel werden nur in der Vollversion angezeigt.</h3>
                  <p className="text-sm text-slate-500 font-medium mb-6">Schalten Sie den vollständigen Funktionsumfang mit der Vollversion frei.</p>
                  
                  {/* DYNAMISCHER JETZT-KAUFEN LINK */}
                  <a 
                    href="https://www.ki-freebie-premium-generator.pepe-verlag.de" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-black text-base uppercase px-6 py-3.5 rounded-xl shadow-lg transition-all transform hover:scale-105 tracking-wide"
                  >
                    🚀 Jetzt Vollversion freischalten
                  </a>
                </div>
              </div>
            )}

            {/* LETZTE SEITE: IMPRESSUM */}
            <div className="pdf-page chapter-block">
              <div className="page-content-wrapper">
                <div className="impressum-page">
                  <h2 className="uppercase tracking-wide">Impressum</h2>
                  <div className="grid gap-6 mt-8 text-slate-800 editable-area" contentEditable>
                    <div>
                      <p className="font-bold text-blue-800 uppercase text-xs tracking-wider mb-1">Angaben gemäß § 5 TMG:</p>
                      <p className="text-base font-semibold">{authorData.name || "—"}</p>
                      {!isDemo && authorData.firma && <p className="text-sm text-slate-600">{authorData.firma}</p>}
                    </div>
                    <div>
                      <p className="font-bold text-blue-800 uppercase text-xs tracking-wider mb-1">Anschrift:</p>
                      <p className="text-sm">{authorData.strasse || "—"}</p>
                      <p className="text-sm">{authorData.plzOrt || "—"}</p>
                    </div>
                    <div>
                      <p className="font-bold text-blue-800 uppercase text-xs tracking-wider mb-1">Kontakt:</p>
                      <p className="text-sm">E-Mail: {authorData.email || "—"}</p>
                      <p className="text-sm">Web: {authorData.web || "—"}</p>
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-200">
                      <p className="font-bold text-xs uppercase tracking-wide text-slate-500 mb-2">Haftungsausschluss / Urheberrecht</p>
                      <p className="text-[10pt] text-slate-600 text-justify leading-relaxed">
                        Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="page-footer">Seite {isDemo ? 46 : getChapterPageNumber(chapters.length)}</div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}