'use client'
import { useState, useEffect, Suspense } from 'react' 
import { useSearchParams, useRouter } from 'next/navigation'
import { CATEGORIES } from '../constants'
import { supabase } from '../../lib/supabase'

function GameContent({ cat }: { cat: string | null }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [items, setItems] = useState<string[]>([])
  const [index, setIndex] = useState(0)
  const [slots, setSlots] = useState<(string | null)[]>(Array(5).fill(null))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true)
      
      if (cat === 'AI_RANKLE') {
        const topic = searchParams.get('topic')
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          // Falls nicht eingeloggt oder falsche Email (Sicherheit)
          if (!session || session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
            console.error("Nicht berechtigt");
            alert("KI-Modus nur für Admins verfügbar.");
            router.push('/');
            return;
          }

          const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ topic })
          })

          const data = await res.json()
          if (data.items) {
            setItems(data.items)
            setLoading(false)
            return
          } else {
            throw new Error(data.error || "Fehler beim Laden")
          }
        } catch (err) {
          console.error("AI Fetch Error:", err)
          router.push('/')
          return
        }
      }

      // FALL 2: Standard-Kategorien
      let list: string[] = []
      if (cat === 'RANDOM') {
        list = Object.values(CATEGORIES).flat()
      } else if (cat && cat in CATEGORIES) {
        list = [...CATEGORIES[cat as keyof typeof CATEGORIES]]
      }
      
      const shuffled = [...list].sort(() => Math.random() - 0.5).slice(0, 10)
      setItems(shuffled)
      setLoading(false)
    }

    loadItems()
  }, [cat, searchParams, router])

  if (loading || items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-black text-slate-400 uppercase tracking-widest text-sm text-center px-4">
          {cat === 'AI_RANKLE' ? 'KI generiert Liste...' : 'Mische Karten...'}
        </p>
      </div>
    )
  }

  const saveRanking = async (finalSlots: (string | null)[]) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('rankings').insert([{ 
      category: cat === 'AI_RANKLE' ? `AI: ${searchParams.get('topic')}` : (cat || 'RANDOM'), 
      result: finalSlots,
      user_id: user.id 
    }])
  }

  const handleRank = (i: number) => {
    if (slots[i] || index >= items.length) return
    const newSlots = [...slots]
    newSlots[i] = items[index]
    setSlots(newSlots)
    
    if (index === 4) saveRanking(newSlots)
    setIndex(index + 1)
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center p-6 text-slate-900">
      <button onClick={() => router.push('/')} className="self-start font-bold text-slate-400 hover:text-black">
        ← ZURÜCK
      </button>
      
      <div className="my-16 text-center">
        <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">
          {cat === 'AI_RANKLE' ? searchParams.get('topic') : 'Next Item'}
        </p>
        <div className="text-5xl font-black lowercase tracking-tighter">
          {index < 5 ? items[index] : "Finish 🎉"}
        </div>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {slots.map((item, i) => (
          <button 
            key={i} 
            onClick={() => handleRank(i)} 
            disabled={!!item || index >= 5}
            className={`w-full h-16 rounded-2xl border-2 flex items-center justify-between px-6 font-bold transition-all
            ${item ? 'bg-slate-900 text-white border-transparent' : 'bg-slate-50 border-slate-100 text-slate-300'}`}
          >
            <span className="italic opacity-50">#{i + 1}</span>
            <span className="text-lg">{item || "platziere hier"}</span>
          </button>
        ))}
      </div>

      {index >= 5 && (
        <button onClick={() => router.push('/')} className="mt-12 bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-xl">
          Neues Spiel
        </button>
      )}
    </main>
  )
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Lädt...</div>}>
      <SearchParamsHandler />
    </Suspense>
  )
}

function SearchParamsHandler() {
  const searchParams = useSearchParams()
  const cat = searchParams.get('cat')
  return <GameContent key={cat} cat={cat} />
}