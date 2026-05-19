import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ 
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" 
});

export default function App() {
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDemo, setIsDemo] = useState(false); 
  const [view, setView] = useState("dashboard"); 
  const [activeTab, setActiveTab] = useState("content");
  const [title, setTitle] = useState("");
  const [extraHints, setExtraHints] = useState("");
  const [authorData, setAuthorData] = useState({
    name: "", firma: "", strasse: "", plzOrt: "", email: "", web: ""
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [outlineTitles, setOutlineTitles] = useState<string[]>([]);
  const [chapters, setChapters] = useState<{title: string, content: string, estimatedPages: number}[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState("https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80");

  const handleLogin = () => {
    if (password === "913F6") {
      setIsLoggedIn(true); setIsDemo(false);
    } else if (password === "913F7") {
      setIsLoggedIn(true); setIsDemo(true);
      setExtraHints("Nur in der Vollversion verfügbar");
    } else {
      alert("Ungültiges Passwort!");
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') handleLogin();
  };

  const generateEbook = async () => {
    if (!title) return alert("Bitte Titel eingeben!");
    setLoading(true);
    setProgress(5);
    try {
      setLoadingStatus("Generiere...");
      const outlineResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Erstelle 12 Kapiteltitel für "${title}".`,
      });
      const lines = (outlineResponse.text || "").split('\n').filter(l => l.length > 3).slice(0, 12);
      setOutlineTitles(lines);
      setChapters([]);
      setView("preview");
    } catch (error: any) {
      alert("Fehler: " + error.message);
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
        if (typeof reader.result === 'string') setCoverImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
        <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-sm w-full text-center border-t-8 border-blue-700">
          <div className="flex items-center justify-center mb-4">
            <img src="/logo_startseite_300x300.png" alt="Logo" className="w-24 h-24 object-contain" />
          </div>
          <input type="password" className="w-full border-2 rounded-xl p-4 mb-4 text-center" placeholder="Passwort" value={password} onChange={(e) => setPassword(e.target.value)} onKeyPress={handleKeyPress} />
          <button onClick={handleLogin} className="w-full bg-blue-700 text-white py-4 rounded-xl font-bold uppercase">Anmelden</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logo_startseite_300x300.png" alt="Logo" className="w-9 h-9 object-contain bg-white rounded" />
          <h2 className="font-bold text-lg uppercase">KI Freebie Generator</h2>
        </div>
      </header>
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl">
           <label>Titel</label>
           <input className="w-full border-2 p-4 rounded-xl mb-4" value={title} onChange={(e) => setTitle(e.target.value)} />
           <button onClick={generateEbook} className="bg-green-600 text-white px-10 py-5 rounded-xl font-black uppercase">Jetzt generieren</button>
        </div>
      </div>
    </div>
  );
}