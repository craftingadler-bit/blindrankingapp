'use client'
import { useState, useEffect, Suspense, useCallback, useRef } from 'react' 
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { Zap, RotateCcw } from 'lucide-react'

type GameItem = { id: string | number; name: string }

function GameContent({ cat }: { cat: string | null }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const slotCount = Number(searchParams.get('slots')) === 10 ? 10 : 5
  const topic = searchParams.get('topic')
  
  const [items, setItems] = useState<GameItem[]>([])
  const [index, setIndex] = useState(0)
  const [slots, setSlots] = useState<(GameItem | null)[]>(Array(slotCount).fill(null))
  
  // FIX 1: Startet direkt auf true, verhindert den ersten unnötigen State-Wechsel
  const [loading, setLoading] = useState(true)
  const [allPossibleItems, setAllPossibleItems] = useState<GameItem[]>([])
  const initializedRef = useRef(false)

  const getFreshItems = useCallback((pool: GameItem[], count: number, currentCat: string) => {
    const storageKey = `played_history_${currentCat}`
    const historyRaw = localStorage.getItem(storageKey)
    const playedIds: (string | number)[] = historyRaw ? JSON.parse(historyRaw) : []

    let available = pool.filter(item => !playedIds.includes(item.id))

    if (available.length < count) {
      available = pool
      localStorage.removeItem(storageKey)
    }

    const selection = [...available]
      .sort(() => Math.random() - 0.5)
      .slice(0, count + 5)

    const newHistory = [...playedIds, ...selection.map(i => i.id)].slice(-(count * 2))
    localStorage.setItem(storageKey, JSON.stringify(newHistory))

    return selection
  }, [])

  // FIX 2: loadItems braucht keinen setLoading(true) mehr am Anfang
  const loadItems = useCallback(async () => {
    try {
      if (cat === 'AI_RANKLE') {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push('/'); return; }

        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ topic, count: slotCount + 5 })
        })

        const data = await res.json()
        if (data.items) {
          const formatted = data.items.map((name: string) => ({ id: name, name }))
          const filtered = getFreshItems(formatted, slotCount, `AI_${topic}`)
          setItems(filtered)
        }
      } else {
        let query = supabase.from('game_items').select('id, name')
        if (cat !== 'RANDOM' && cat) {
          query = query.eq('category', cat)
        }

        const { data, error } = await query
        if (error || !data || data.length === 0) {
          router.push('/'); return
        }

        setAllPossibleItems(data)
        const filtered = getFreshItems(data, slotCount, cat || 'RANDOM')
        setItems(filtered)
      }
    } catch (err) {
      console.error(err)
      router.push('/')
    } finally {
      // Am Ende immer loading beenden
      setLoading(false)
    }
  }, [cat, topic, slotCount, router, getFreshItems])
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      loadItems()
    }
  }, [loadItems])

  const resetGame = () => {
    // FIX 3: Im Klick-Event ist setLoading(true) völlig okay
    setLoading(true)
    setIndex(0)
    setSlots(Array(slotCount).fill(null))
    
    if (cat !== 'AI_RANKLE' && allPossibleItems.length > 0) {
      const filtered = getFreshItems(allPossibleItems, slotCount, cat || 'RANDOM')
      setItems(filtered)
      setLoading(false)
    } else {
      loadItems()
    }
  }

  const saveRanking = async (finalSlots: (GameItem | null)[]) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const namesOnly = finalSlots.map(s => s?.name || null)

    await supabase.from('rankings').insert([{ 
      category: cat === 'AI_RANKLE' ? `AI: ${topic}` : (cat || 'RANDOM'), 
      result: namesOnly,
      user_id: user.id 
    }])
  }

  const handleRank = (i: number) => {
    if (slots[i] || index >= slotCount) return
    
    const newSlots = [...slots]
    newSlots[i] = items[index]
    setSlots(newSlots)
    
    if (index === slotCount - 1) {
      saveRanking(newSlots)
    }
    setIndex(index + 1)
  }

  if (loading || items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-black text-slate-400 uppercase tracking-widest text-sm">Bereite Items vor...</p>
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
          {cat === 'AI_RANKLE' ? topic : cat}
        </p>
        <div className={`font-black lowercase tracking-tighter ${slotCount === 10 ? 'text-4xl' : 'text-5xl'}`}>
          {index < slotCount ? items[index]?.name : "Finish 🎉"}
        </div>
      </div>

      <div className={`w-full max-w-sm sm:max-w-md grid gap-2`}>
        {slots.map((item, i) => (
          <button 
            key={i} 
            onClick={() => handleRank(i)} 
            disabled={!!item || index >= slotCount}
            className={`w-full rounded-2xl border-2 flex items-center justify-between px-6 font-bold transition-all
            ${item ? 'bg-slate-900 text-white border-transparent shadow-lg scale-[1.02]' : 'bg-slate-50 border-slate-100 text-slate-300 hover:border-blue-500'}
            ${slotCount === 10 ? 'h-12 text-sm' : 'h-16 text-lg'}`}
          >
            <span className="italic opacity-50">#{i + 1}</span>
            <span className="truncate ml-4">{item?.name || "platziere hier"}</span>
          </button>
        ))}
      </div>

      {index >= slotCount && (
        <div className="mt-8 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button 
            onClick={resetGame} 
            className="flex items-center gap-3 bg-slate-900 text-white px-10 py-4 rounded-full font-black shadow-xl hover:bg-blue-600 transition-all uppercase tracking-widest group"
          >
            <Zap size={18} className="group-hover:text-yellow-400 fill-current" />
            Nochmal spielen
          </button>
          
          <button 
            onClick={() => router.push('/')} 
            className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-colors text-sm uppercase tracking-widest"
          >
            <RotateCcw size={14} /> Andere Kategorie
          </button>
        </div>
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
  // Der key={cat} sorgt dafür, dass bei einer neuen Kategorie die Komponente komplett neu "geboren" wird,
  // inklusive neuem initialem State (loading = true).
  return <GameContent key={cat} cat={cat} />
}