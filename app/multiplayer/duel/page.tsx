'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Zap, ArrowLeft } from 'lucide-react'
import { ICONS } from '@/lib/icons'

const SENSITIVE_CATEGORIES = [
  "Orte für Sex", 
  "Sexstellungen", 
  "Attraktivität"
];

export default function DuelSetupScreen() {
  const router = useRouter()
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingCategory, setCreatingCategory] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [slotCount, setSlotCount] = useState<5 | 10>(5)

  useEffect(() => {
    const fetchCats = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && process.env.NEXT_PUBLIC_ADMIN_EMAIL && user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        setIsAdmin(true)
      }
      
      const { data, error } = await supabase.from('game_items').select('category')
      if (data && !error) {
        const unique = Array.from(new Set(data.map(i => i.category))).filter(c => c !== 'Situationen')
        setCategories(unique)
      }
      setLoading(false)
    }
    fetchCats()
  }, [])

  const createDuelRoom = async (category: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: { session } } = await supabase.auth.getSession()

    if (!user || !session) {
      alert('Bitte logge dich ein, um ein Duell zu starten.');
      router.push('/login');
      return;
    }

    setCreatingCategory(category);
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ category, slots: slotCount }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
          throw new Error(`API error (Status ${res.status}). Hast du die route.ts in app/api/rooms/create/route.ts verschoben?`);
      }

      const data = await res.json();

      if (res.ok) {
        router.push(`/rooms/${data.roomId}`);
      } else {
        alert(`Fehler: ${data.error}`);
      }
    } catch (error) {
      console.error(error)
      alert('Ein unerwarteter Fehler ist aufgetreten. Bitte prüfe die Konsole für mehr Details.');
    } finally {
      setCreatingCategory(null);
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col p-6 lg:p-12 text-slate-900">
      <div className="max-w-3xl mx-auto w-full mt-10">
        <Link href="/multiplayer" className="inline-flex items-center gap-2 font-bold text-slate-400 hover:text-blue-600 transition-colors mb-12">
          <ArrowLeft size={20} /> Zurück
        </Link>
        
        <div className="mb-12">
          <h1 className="text-4xl lg:text-5xl font-black italic tracking-tighter mb-2">
            WECHSEL-<span className="text-blue-600">DUELL</span>
          </h1>
          <p className="text-slate-500 font-bold">Wähle eine Kategorie, um den Raum zu erstellen.</p>
        </div>

        <div className="mb-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Slots (Items)</p>
          <div className="bg-slate-50 p-1 rounded-2xl flex relative w-full max-w-sm border border-slate-200">
            <button onClick={() => setSlotCount(5)} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all z-10 ${slotCount === 5 ? 'text-blue-600' : 'text-slate-400'}`}>5 SLOTS</button>
            <button onClick={() => setSlotCount(10)} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all z-10 ${slotCount === 10 ? 'text-blue-600' : 'text-slate-400'}`}>10 SLOTS</button>
            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-md transition-all duration-300 ${slotCount === 10 ? 'left-[calc(50%+2px)]' : 'left-1'}`}></div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories
              .filter(cat => isAdmin || !SENSITIVE_CATEGORIES.includes(cat))
              .map(cat => (
                <button
                  key={cat}
                  onClick={() => createDuelRoom(cat)}
                  disabled={creatingCategory !== null}
                  className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-blue-500 hover:bg-white transition-all group text-left"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl group-hover:scale-110 transition-transform">{ICONS[cat as keyof typeof ICONS] || "✨"}</span>
                    <span className="font-bold text-slate-600 group-hover:text-blue-600">{cat}</span>
                  </div>
                  {creatingCategory === cat ? (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Zap size={18} className="text-slate-300 group-hover:text-blue-600" />
                  )}
                </button>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}