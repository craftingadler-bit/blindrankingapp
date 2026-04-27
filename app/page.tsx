'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { CATEGORIES } from './constants'
import { User } from '@supabase/supabase-js'

const ICONS: Record<string, string> = {
  Fussball: "⚽",
  Filme: "🍿",
  Essen: "🍔",
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [customTopic, setCustomTopic] = useState("")
  const [hasMounted, setHasMounted] = useState(false)

  // --- VERBESSERTE ADMIN-LOGIK ---
  // Wir stellen sicher, dass isAdmin nur true ist, wenn user UND env-variable existieren
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isAdmin = !!user && !!adminEmail && user.email === adminEmail;

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setHasMounted(true); // Erst hier true setzen
    };
    
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setHasMounted(true);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col p-6 text-slate-900 selection:bg-blue-200">
      
      {/* Header (unverändert) */}
      <header className="w-full max-w-5xl mx-auto flex justify-end mb-8">
        {user ? (
          <div className="flex items-center gap-4">
            <Link href="/notes" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Ideen</Link>
            <span className="text-sm font-medium text-slate-400">|</span>
            <Link href="/profile" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Meine Rankings</Link>
            <span className="text-sm font-medium text-slate-400">|</span>
            <span className="text-sm font-medium text-slate-600">{user.email}</span>
            <button onClick={handleLogout} className="bg-white border border-slate-200 px-4 py-2 rounded-full text-sm font-bold hover:bg-slate-100 transition-colors">Abmelden</button>
          </div>
        ) : (
          <Link href="/login" className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">Anmelden</Link>
        )}
      </header>

      {/* Hero & Bento Grid (unverändert) */}
      <div className="text-center mb-16 space-y-4">
        <div className="inline-block bg-blue-100 text-blue-700 font-bold px-4 py-1.5 rounded-full text-sm mb-4 tracking-wide">v1.0 Live</div>
        <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-slate-900">Blind<span className="text-blue-600">Rank</span></h1>
        <p className="text-lg text-slate-500 font-medium max-w-md mx-auto">Wähle eine Kategorie oder nutze die KI.</p>
      </div>

      <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/game?cat=RANDOM" className="md:col-span-3 relative overflow-hidden bg-slate-900 text-white p-10 rounded-4xl shadow-2xl hover:-translate-y-1 transition-all group">
            <h2 className="text-4xl font-black mb-2">Main Game 🎲</h2>
            <p className="text-slate-300">Zufälliger Mix aus allen Kategorien.</p>
        </Link>
        {Object.keys(CATEGORIES).map((cat) => (
          <Link key={cat} href={`/game?cat=${cat}`} className="bg-white border border-slate-200 p-8 rounded-4xl hover:border-blue-500 transition-all group">
            <div className="text-4xl mb-4">{ICONS[cat] || "✨"}</div>
            <h3 className="text-2xl font-bold">{cat}</h3>
          </Link>
        ))}
      </div>

      {/* AI RANKLE SECTION (DER FIX) */}
      <div className="w-full max-w-4xl mx-auto mt-25 mb-20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-900 uppercase">AI <span className="text-blue-600">-</span> Rankle</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">Powered by Gemini 3.1 Flash</p>
        </div>

        {/* CONTAINER: Wird grau und halbtransparent wenn kein Admin */}
        <div className={`p-2 rounded-3xl shadow-2xl border transition-all duration-500 ${
          hasMounted && isAdmin 
          ? 'bg-white border-slate-100 opacity-100' 
          : 'bg-slate-200 border-transparent opacity-50 grayscale'
        }`}>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder={
                !hasMounted ? "Prüfe Berechtigung..." :
                isAdmin ? "Eigenes Thema (z.B. One Piece, Autos...)" : 
                "KI-Modus nur für Admins gesperrt"
              }
              className="flex-1 px-6 py-4 rounded-2xl outline-none font-medium text-lg text-slate-900 bg-transparent disabled:cursor-not-allowed"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              disabled={!hasMounted || !isAdmin} // Blockiert Eingabe komplett
            />
            <Link 
              href={`/game?cat=AI_RANKLE&topic=${encodeURIComponent(customTopic)}`}
              className={`px-8 py-4 rounded-2xl font-black transition-all ${
                hasMounted && isAdmin && customTopic.length > 2 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-slate-300 text-slate-500 pointer-events-none' // Klick unmöglich
              }`}
            >
              START
            </Link>
          </div>
        </div>
        
        {/* STATUS-TEXT UNTER DEM FELD */}
        {hasMounted && (
          <p className="text-center text-[10px] font-bold text-slate-400 uppercase mt-4 tracking-widest">
            {!user 
              ? "❌ Nicht angemeldet (Sperre aktiv)" 
              : !isAdmin 
              ? `❌ Angemeldet als ${user.email} (Kein Admin)` 
              : "✅ Admin-Modus aktiv"}
          </p>
        )}
      </div>
    </main>
  )
}