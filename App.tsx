import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

// API Initialisierung über Umgebungsvariable
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

  // Login & Generierung Funktionen bleiben wie in deinem Code, hier gekürzt für Übersicht
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

  // ... (Hier bleiben deine generateEbook, handleImageUpload etc. Funktionen identisch) ...

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
        <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-sm w-full text-center border-t-8 border-blue-700">
          <div className="flex items-center justify-center mb-4">
            <img src="/logo_startseite_300x300.png" alt="Pepe Logo" className="w-24 h-24 object-contain rounded-xl bg-white p-1 shadow-sm" />
          </div>
          <h1 className="text-3xl font-black text-gray-800 uppercase mb-0.5">Pepe Verlag</h1>
          <input type="password" className="w-full border-2 rounded-xl p-4 mb-4 text-center text-black" placeholder="Passwort" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={handleLogin} className="w-full bg-blue-700 text-white py-4 rounded-xl font-bold uppercase">Anmelden</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* HEADER mit korrigiertem Logo-Pfad */}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <img src="/logo_startseite_300x300.png" alt="Pepe Logo" className="w-9 h-9 object-contain rounded bg-white p-0.5" />
          <h2 className="font-bold text-lg uppercase">KI Freebie Generator</h2>
        </div>
        {/* ... Rest deines Headers ... */}
      </header>

      {/* Hier folgt dein restliches JSX-Layout ... */}
      {view === "dashboard" && (
          <div className="max-w-4xl mx-auto py-10 px-4">
              {/* ... dein Dashboard-Content ... */}
          </div>
      )}
    </div>
  );
}