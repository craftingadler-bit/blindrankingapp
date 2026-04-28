'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'

const ICONS: Record<string, string> = {
  Fussball: "⚽",
  Filme: "🍿",
  Serien: "📺",
  Städte: "🏙️",
  Essen: "🍔",
  Schulfächer: "📚",
  Autos: "🚗",
  Automodelle: "🏎️",
  Reiseziele: "✈️",
  "Orte für Sex": "🔥",
  Sexstellungen: "🔞",
  "Kampf-Gegner": "⚔️",
  Attraktivität: "✨",
  "Date-Eigenschaften": "🚩",
  RANDOM: "🎲"
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [customTopic, setCustomTopic] = useState("")
  const [hasMounted, setHasMounted] = useState(false)
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  
  // NEU: State für die Anzahl der Ranking-Slots
  const [slotCount, setSlotCount] = useState<5 | 10>(5)

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isAdmin = !!user && !!adminEmail && user.email === adminEmail;

  useEffect(() => {
    const loadInitialData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData.user);

      const { data: items, error } = await supabase.from('game_items').select('category');
      if (items && !error) {
        const uniqueCats = Array.from(new Set(items.map(i => i.category)));
        setAvailableCategories(uniqueCats);
      }
      setHasMounted(true);
    };
    loadInitialData();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => { await supabase.signOut() }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-200">
      
      {/* SIDEBAR LINKS */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 overflow-y-auto shadow-sm">
        <div className="p-8">
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 mb-6">
            Blind<span className="text-blue-600">Rank</span>
          </h1>

          {/* NEU: Slot-Schalter (Pill-Design) */}
          <div className="mb-10 bg-slate-100 p-1 rounded-2xl flex relative">
            <button 
              onClick={() => setSlotCount(5)}
              className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all z-10 ${slotCount === 5 ? 'text-blue-600' : 'text-slate-400'}`}
            >
              5 SLOTS
            </button>
            <button 
              onClick={() => setSlotCount(10)}
              className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all z-10 ${slotCount === 10 ? 'text-blue-600' : 'text-slate-400'}`}
            >
              10 SLOTS
            </button>
            {/* Animierter Hintergrund-Slider */}
            <div 
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-all duration-300 ${
                slotCount === 10 ? 'left-[calc(50%+2px)]' : 'left-1'
              }`}
            ></div>
          </div>
          
          <nav className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Modi</p>
            <Link 
              href={`/game?cat=RANDOM&slots=${slotCount}`} 
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 text-white font-bold hover:scale-105 transition-all mb-6 shadow-lg shadow-slate-200"
            >
              <span>🎲</span> Main Game
            </Link>

            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Kategorien</p>
            {availableCategories.map((cat) => (
              <Link 
                key={cat} 
                href={`/game?cat=${cat}&slots=${slotCount}`} 
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-50 hover:text-blue-600 transition-all group"
              >
                <span className="text-xl group-hover:scale-125 transition-transform">{ICONS[cat] || "✨"}</span>
                <span className="truncate">{cat}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* MAIN CONTENT RECHTS */}
      <main className="flex-1 flex flex-col p-8 md:p-12">
        
        {/* Header */}
        <header className="flex justify-end items-center gap-6 mb-12">
          {user ? (
            <div className="flex items-center gap-4 bg-white p-2 px-4 rounded-full border border-slate-100 shadow-sm">
              <Link href="/notes" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Ideen</Link>
              <Link href="/profile" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Profile</Link>
              <div className="w-[1px] h-4 bg-slate-200"></div>
              <span className="text-sm font-medium text-slate-500">{user.email?.split('@')[0]}</span>
              <button onClick={handleLogout} className="text-xs font-black text-red-400 hover:text-red-600 uppercase tracking-tighter">Exit</button>
            </div>
          ) : (
            <Link href="/login" className="bg-blue-600 text-white px-8 py-3 rounded-full text-sm font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">ANMELDEN</Link>
          )}
        </header>

        {/* Hero Area */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
          <div className="text-center mb-16">
            <div className="inline-block bg-blue-100 text-blue-700 font-bold px-4 py-1.5 rounded-full text-sm mb-6 tracking-wide uppercase">v1.2 Platform Update</div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 leading-tight">
              Das ultimative <br />
              <span className="text-blue-600 underline decoration-blue-200 underline-offset-8">Ranking Duell.</span>
            </h2>
            <p className="mt-8 text-xl text-slate-400 font-medium max-w-xl mx-auto">
              Wähle links die Anzahl der Slots und eine Kategorie.
            </p>
          </div>

          {/* AI SECTION */}
          <div className="w-full bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
            <div className="flex flex-col items-center mb-10">
              <h3 className="text-3xl font-black text-slate-900 uppercase">AI Rankle</h3>
              <div className="h-1 w-12 bg-blue-600 mt-2 rounded-full"></div>
            </div>

            <div className={`p-3 rounded-[2rem] border transition-all duration-700 ${
              hasMounted && isAdmin 
              ? 'bg-slate-50 border-slate-200 opacity-100' 
              : 'bg-slate-100 border-transparent opacity-40 grayscale'
            }`}>
              <div className="flex flex-col md:flex-row gap-3">
                <input 
                  type="text" 
                  placeholder={
                    !hasMounted ? "System lädt..." :
                    isAdmin ? "Thema eingeben (z.B. Avengers, Rapper...)" : 
                    "KI-Modus nur für Admins"
                  }
                  className="flex-1 px-8 py-5 rounded-2xl outline-none font-bold text-xl text-slate-900 bg-transparent disabled:cursor-not-allowed"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  disabled={!hasMounted || !isAdmin}
                />
                <Link 
                  href={`/game?cat=AI_RANKLE&topic=${encodeURIComponent(customTopic)}&slots=${slotCount}`}
                  className={`px-12 py-5 rounded-2xl font-black text-lg text-center transition-all ${
                    hasMounted && isAdmin && customTopic.length > 2 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.02] shadow-xl shadow-blue-200' 
                    : 'bg-slate-300 text-slate-500 pointer-events-none'
                  }`}
                >
                  GENERIEREN
                </Link>
              </div>
            </div>
            
            {hasMounted && (
              <p className="text-center text-[10px] font-black text-slate-400 uppercase mt-6 tracking-[0.2em]">
                {!user ? "Sperre: Nicht angemeldet" : !isAdmin ? "Sperre: Kein Admin-Zugriff" : "Status: Bereit für Prompts"}
              </p>
            )}
          </div>
        </div>

        {/* Footer info */}
        <footer className="mt-20 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">© 2026 BlindRank Engine • Powered by Gemini Flash</p>
        </footer>
      </main>
    </div>
  )
}