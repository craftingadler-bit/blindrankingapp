'use client'
import { useState, useEffect, Suspense } from 'react' 
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

function GameContent({ cat }: { cat: string | null }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // NEU: Slots aus URL auslesen (Default 5)
  const slotCount = Number(searchParams.get('slots')) === 10 ? 10 : 5
  
  const [items, setItems] = useState<string[]>([])
  const [index, setIndex] = useState(0)
  // NEU: Dynamische Array-Größe basierend auf slotCount
  const [slots, setSlots] = useState<(string | null)[]>(Array(slotCount).fill(null))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true)
      
      // FALL 1: AI Rankle
      if (cat === 'AI_RANKLE') {
        const topic = searchParams.get('topic')
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session || session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
            router.push('/');
            return;
          }

          const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            // Wir fordern ein paar mehr an, als wir Slots haben
            body: JSON.stringify({ topic, count: slotCount + 2 })
          })

          const data = await res.json()
          if (data.items) {
            setItems(data.items)
            setLoading(false)
            return
          }
        } catch (err) {
          console.error("AI Fetch Error:", err)
          router.push('/')
          return
        }
      }

      // FALL 2: Datenbank-Kategorien
      try {
        let query = supabase.from('game_items').select('name')
        if (cat !== 'RANDOM' && cat) {
          query = query.eq('category', cat)
        }

        const { data, error } = await query

        if (error || !data || data.length === 0) {
          router.push('/')
          return
        }

        // Mischen und genug Items für die gewählte Slot-Anzahl nehmen
        const shuffled = data
          .map(d => d.name)
          .sort(() => Math.random() - 0.5)
          .slice(0, slotCount + 5)

        setItems(shuffled)
      } catch (err) {
        router.push('/')
      }
      setLoading(false)
    }

    loadItems()
  }, [cat, searchParams, router, slotCount])

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
    // Verhindert Klicks auf belegte Slots oder wenn das Spiel vorbei ist
    if (slots[i] || index >= slotCount) return
    
    const newSlots = [...slots]
    newSlots[i] = items[index]
    setSlots(newSlots)
    
    // Speichern, wenn der letzte Slot (slotCount - 1) belegt wurde
    if (index === slotCount - 1) {
      saveRanking(newSlots)
    }
    setIndex(index + 1)
  }

  if (loading || items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-black text-slate-400 uppercase tracking-widest text-sm">
          {cat === 'AI_RANKLE' ? 'KI generiert Liste...' : 'Lade Items aus DB...'}
        </p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center p-6 text-slate-900">
      <button onClick={() => router.push('/')} className="self-start font-bold text-slate-400 hover:text-black transition-colors">
        ← ZURÜCK
      </button>
      
      <div className="my-10 text-center">
        <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">
          {cat === 'AI_RANKLE' ? searchParams.get('topic') : cat}
        </p>
        <div className={`font-black lowercase tracking-tighter ${slotCount === 10 ? 'text-4xl' : 'text-5xl'}`}>
          {index < slotCount ? items[index] : "Finish 🎉"}
        </div>
      </div>

      {/* Grid-Layout: Bei 10 Slots nutzen wir 2 Spalten auf Desktop, um Scrollen zu vermeiden */}
      <div className={`w-full max-w-sm sm:max-w-md grid gap-2 ${slotCount === 10 ? 'grid-cols-1 sm:grid-cols-1' : 'grid-cols-1'}`}>
        {slots.map((item, i) => (
          <button 
            key={i} 
            onClick={() => handleRank(i)} 
            disabled={!!item || index >= slotCount}
            className={`w-full rounded-2xl border-2 flex items-center justify-between px-6 font-bold transition-all
            ${item ? 'bg-slate-900 text-white border-transparent shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-300 hover:border-blue-500'}
            ${slotCount === 10 ? 'h-12 text-sm' : 'h-16 text-lg'}`}
          >
            <span className="italic opacity-50">#{i + 1}</span>
            <span className="truncate ml-4">{item || "platziere hier"}</span>
          </button>
        ))}
      </div>

      {index >= slotCount && (
        <button onClick={() => router.push('/')} className="mt-8 bg-blue-600 text-white px-10 py-4 rounded-full font-black shadow-xl hover:bg-blue-700 transition-all uppercase tracking-widest">
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
  // Key erzwingt Neu-Rendern bei Kategoriewechsel
  return <GameContent key={cat} cat={cat} />
}