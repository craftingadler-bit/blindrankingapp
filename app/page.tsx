'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'
import { 
  Zap, Play, BarChart3, LogOut, Sparkles, Wand2, 
  ChevronDown, Lightbulb, Trophy, Menu, X 
} from 'lucide-react'
import { ICONS } from '../lib/icons'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [customTopic, setCustomTopic] = useState("")
  const [hasMounted, setHasMounted] = useState(false)
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [slotCount, setSlotCount] = useState<5 | 10>(5)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isAdmin = !!user && !!adminEmail && user.email === adminEmail;

  useEffect(() => {
    const loadInitialData = async () => {
      // 1. Slot-Präferenz aus LocalStorage laden
      const savedSlots = localStorage.getItem('blindrank_slots')
      if (savedSlots === '5' || savedSlots === '10') {
        setSlotCount(Number(savedSlots) as 5 | 10)
      }

      const { data: userData } = await supabase.auth.getUser();
      setUser(userData.user);

      const { data: items, error } = await supabase.from('game_items').select('category');
      if (items && !error) {
        const uniqueCats = Array.from(new Set(items.map(i => i.category)))
          .filter(cat => cat !== 'Situationen');
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

  // NEU: Hilfsfunktion zum Speichern der Auswahl
  const updateSlotCount = (count: 5 | 10) => {
    setSlotCount(count)
    localStorage.setItem('blindrank_slots', count.toString())
  }

  const scrollToContent = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogout = async () => { await supabase.auth.signOut() }

  return (
    <div className="flex min-h-screen bg-white text-slate-900 selection:bg-yellow-200">
      
      {/* 1. SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-150 w-80 bg-slate-50 border-r border-slate-100 transform transition-transform duration-300 flex flex-col
        lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="p-8 flex flex-col h-full">
          <div className="flex justify-between items-center mb-12">
            <div className="cursor-pointer" onClick={() => { window.scrollTo({top: 0, behavior: 'smooth'}); setIsMobileMenuOpen(false); }}>
              <h1 className="text-4xl font-black tracking-tighter italic">
                BLIND<span className="text-blue-600 drop-shadow-sm">RANK</span>
              </h1>
            </div>
            <button className="lg:hidden p-2 text-slate-400" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={24} />
            </button>
          </div>

          <div className="mb-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Match Length</p>
            <div className="bg-slate-200/50 p-1 rounded-2xl flex relative w-full border border-slate-200">
              {/* Geändert auf updateSlotCount */}
              <button onClick={() => updateSlotCount(5)} className={`flex-1 py-2.5 text-[10px] font-black rounded-xl transition-all z-10 ${slotCount === 5 ? 'text-blue-600' : 'text-slate-400'}`}>5 SLOTS</button>
              <button onClick={() => updateSlotCount(10)} className={`flex-1 py-2.5 text-[10px] font-black rounded-xl transition-all z-10 ${slotCount === 10 ? 'text-blue-600' : 'text-slate-400'}`}>10 SLOTS</button>
              <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-md transition-all duration-300 ${slotCount === 10 ? 'left-[calc(50%+2px)]' : 'left-1'}`}></div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto pr-2 space-y-8 custom-scrollbar">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Navigation</p>
              <Link href="/stats" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-600 font-bold hover:bg-white hover:shadow-sm transition-all">
                <BarChart3 size={18} /> Leaderboard
              </Link>
            </div>

            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Categories</p>
              <div className="space-y-1">
                {availableCategories.map((cat) => (
                  <Link 
                    key={cat} 
                    href={`/game?cat=${cat}&slots=${slotCount}`} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-500 font-bold hover:text-blue-600 hover:bg-white transition-all group text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="group-hover:scale-125 transition-transform">{ICONS[cat] || "✨"}</span>
                      {cat}
                    </div>
                    <Play size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-140 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col relative min-w-0 lg:ml-80">
        
        {/* MOBILE MENU TRIGGER */}
        <button 
          className="lg:hidden fixed top-6 left-6 z-100 p-3 bg-white rounded-full shadow-xl border border-slate-100"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu size={24} />
        </button>

        {/* TOP-RIGHT NAVIGATION */}
        <div className="fixed top-6 right-6 lg:top-8 lg:right-8 z-100 flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md p-1.5 rounded-full border border-slate-200 shadow-2xl">
                <Link href="/notes" title="Ideen" className="p-2.5 text-slate-500 hover:text-blue-600 transition-all"><Lightbulb size={18} /></Link>
                <Link href="/rankings" title="Meine Rankings" className="p-2.5 text-slate-500 hover:text-blue-600 transition-all"><Trophy size={18} /></Link>
                <div className="w-px h-4 bg-slate-200 mx-1"></div>
                <Link href="/profile" className="flex items-center gap-3 pl-3 pr-1">
                  <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight block">
                    {user.email?.split('@')[0]}
                  </span>
                  <div className="w-9 h-9 bg-slate-900 rounded-full flex items-center justify-center text-white text-xs font-black ring-4 ring-slate-50 shrink-0">
                    {user.email?.[0].toUpperCase()}
                  </div>
                </Link>
              </div>
              <button onClick={handleLogout} className="p-3 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-red-500 transition-all shadow-xl">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link href="/login" className="bg-slate-900 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 shadow-2xl transition-all">
              Join Engine
            </Link>
          )}
        </div>

        {/* HERO SECTION */}
        <section className="h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-white px-6">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
            <h1 className="text-[40vw] lg:text-[30vw] font-black italic tracking-tighter leading-none uppercase">Chaos</h1>
          </div>
          <div className="relative z-10 text-center">
            <h1 className="text-7xl md:text-[12rem] font-black italic tracking-tighter leading-[0.8] mb-8">
              BLIND<br />
              <span className="text-blue-600">RANK.</span>
            </h1>
            <button 
              onClick={scrollToContent}
              className="group flex items-center gap-4 bg-slate-900 text-white px-10 lg:px-12 py-5 lg:py-6 rounded-full font-black uppercase text-[10px] lg:text-sm tracking-[0.3em] hover:bg-blue-600 transition-all shadow-2xl"
            >
              SPIEL STARTEN <Play size={18} fill="currentColor" />
            </button>
          </div>
        </section>

        {/* CONTENT */}
        <div ref={contentRef} className="p-6 md:p-12 max-w-5xl mx-auto w-full pt-40">
          <section className="mb-32">
            <div onClick={() => router.push(`/game?cat=Situationen&slots=${slotCount}`)} className="relative group cursor-pointer w-full">
              <div className="absolute -inset-1 bg-linear-to-r from-red-600 via-purple-600 to-blue-600 rounded-[3rem] lg:rounded-[4rem] blur opacity-15 group-hover:opacity-40 transition duration-700"></div>
              <div className="relative bg-slate-900 rounded-[2.5rem] lg:rounded-[3.5rem] p-12 lg:p-24 overflow-hidden border border-white/5 shadow-2xl flex flex-col items-center text-center text-white">
                <h2 className="text-6xl lg:text-9xl font-black italic tracking-tighter mb-8 leading-[0.85]">
                  COMPLETE <br />
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-yellow-400 via-orange-500 to-red-600">RANDOM</span>
                </h2>
                <div className="inline-flex items-center gap-6 bg-white text-black px-12 py-6 rounded-full font-black uppercase text-sm tracking-[0.3em] group-hover:bg-yellow-400 shadow-2xl">
                  CHAOS MODUS <Zap size={18} fill="black" />
                </div>
              </div>
            </div>
          </section>

          {/* AI LABORATORY */}
          <section className="max-w-3xl mx-auto w-full pb-32">
            <div className="text-center mb-10">
              <h3 className="text-3xl lg:text-4xl font-black italic tracking-tighter text-slate-900 uppercase">Custom Rankle</h3>
            </div>
            <div className={`relative p-3 rounded-[3rem] border transition-all duration-500 ${isAdmin ? 'bg-white border-slate-200 shadow-2xl' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
              <div className="flex flex-col md:flex-row items-center gap-3">
                <div className="flex-1 flex items-center px-6 lg:px-8 w-full">
                  <Wand2 size={24} className="text-blue-500 mr-4" />
                  <input 
                    type="text" 
                    placeholder="Wähle ein Thema..."
                    className="w-full py-5 lg:py-6 outline-none font-bold text-xl lg:text-2xl text-slate-900 bg-transparent placeholder:text-slate-300"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    disabled={!isAdmin}
                  />
                </div>
                <button 
                  onClick={() => router.push(`/game?cat=AI_RANKLE&topic=${encodeURIComponent(customTopic)}&slots=${slotCount}`)}
                  disabled={!isAdmin || customTopic.length < 3}
                  className="w-full md:w-auto bg-blue-600 text-white px-12 py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100 hover:bg-slate-900 transition-all"
                >
                  Create
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  )
}