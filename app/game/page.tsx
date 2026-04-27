'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CATEGORIES } from '../constants'

function GameContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const cat = searchParams.get('cat')
  
  const [items, setItems] = useState<string[]>([])
  const [index, setIndex] = useState(0)
  const [slots, setSlots] = useState<(string | null)[]>(Array(5).fill(null))

  useEffect(() => {
    let list: string[] = []
    if (cat === 'RANDOM') {
      list = Object.values(CATEGORIES).flat()
    } else if (cat && cat in CATEGORIES) {
      list = [...CATEGORIES[cat as keyof typeof CATEGORIES]]
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(list.sort(() => Math.random() - 0.5).slice(0, 10))
  }, [cat])

  const handleRank = (i: number) => {
    if (slots[i] || index >= items.length) return
    const newSlots = [...slots]
    newSlots[i] = items[index]
    setSlots(newSlots)
    setIndex(index + 1)
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center p-6">
      <button onClick={() => router.push('/')} className="self-start font-bold text-slate-400">← ZURÜCK</button>
      
      <div className="my-16 text-center">
        <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">Next Item</p>
        <div className="text-6xl font-black lowercase tracking-tighter">
          {index < items.length ? items[index] : "Finish"}
        </div>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {slots.map((item, i) => (
          <button key={i} onClick={() => handleRank(i)} disabled={!!item}
            className={`w-full h-16 rounded-2xl border-2 flex items-center justify-between px-6 font-bold transition-all
            ${item ? 'bg-slate-900 text-white border-transparent shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
            <span className="italic opacity-50">#{i + 1}</span>
            <span>{item || "platziere hier"}</span>
          </button>
        ))}
      </div>
    </main>
  )
}

export default function GamePage() {
  return (
    <Suspense fallback={<div>Lädt...</div>}>
      <GameContent />
    </Suspense>
  )
}
