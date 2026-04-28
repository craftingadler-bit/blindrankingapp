'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { User } from '@supabase/supabase-js'

interface Ranking {
  id: string
  category: string
  result: string[]
  created_at: string
  user_id: string
}

const ICONS: Record<string, string> = {
  Fussball: "⚽", Filme: "🍿", Serien: "📺", Städte: "🏙️", Essen: "🍔",
  Schulfächer: "📚", Autos: "🚗", Automodelle: "🏎️", Reiseziele: "✈️",
  "Orte für Sex": "🔥", Sexstellungen: "🔞", "Kampf-Gegner": "⚔️",
  Attraktivität: "✨", "Date-Eigenschaften": "🚩", RANDOM: "🎲",
  KI: "🤖" // Icon für den gesammelten KI-Punkt
}

export default function ProfilePage() {
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  
  const [selectedCategory, setSelectedCategory] = useState<string>("Alle")
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [hasAIEntries, setHasAIEntries] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user: activeUser } } = await supabase.auth.getUser()
      if (!activeUser) {
        router.push('/login')
        return
      }
      setUser(activeUser)

      const { data, error } = await supabase
        .from('rankings')
        .select('*')
        .eq('user_id', activeUser.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setRankings(data)
        
        // Normale Kategorien extrahieren (alles was nicht mit AI: beginnt)
        const normalCats = Array.from(new Set(
          data.filter(r => !r.category.startsWith('AI:'))
              .map(r => r.category)
        ))
        setAvailableCategories(normalCats)

        // Prüfen, ob es überhaupt KI-Einträge gibt
        const aiExists = data.some(r => r.category.startsWith('AI:'))
        setHasAIEntries(aiExists)
      }
      setLoading(false)
    }
    fetchData()
  }, [router])

  // NEU: Filter-Logik mit KI-Gruppierung
  const filteredRankings = rankings.filter(r => {
    if (selectedCategory === "Alle") return true
    if (selectedCategory === "KI") return r.category.startsWith('AI:')
    return r.category === selectedCategory
  })

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400 uppercase tracking-widest">Lädt History...</div>

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.push('/')} className="mb-8 font-black text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-2 text-xs">
          ← BACK TO GAME
        </button>

        <div className="mb-12">
          <h1 className="text-5xl font-black tracking-tighter italic">History</h1>
          <p className="text-slate-400 font-bold mt-2 uppercase text-[10px] tracking-[0.3em]">{user?.email}</p>
        </div>

        {/* Filter-Leiste */}
        <div className="flex flex-wrap gap-2 mb-10">
          <button
            onClick={() => setSelectedCategory("Alle")}
            className={`px-5 py-2.5 rounded-2xl text-[10px] font-black transition-all ${
              selectedCategory === "Alle" ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-400 border border-slate-200'
            }`}
          >
            ALLE ({rankings.length})
          </button>

          {/* Der gesammelte KI-Punkt */}
          {hasAIEntries && (
            <button
              onClick={() => setSelectedCategory("KI")}
              className={`px-5 py-2.5 rounded-2xl text-[10px] font-black transition-all flex items-center gap-2 ${
                selectedCategory === "KI" ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-indigo-400 border border-indigo-100'
              }`}
            >
              <span>{ICONS.KI}</span> KI GENERIERT
            </button>
          )}

          {/* Die normalen Kategorien */}
          {availableCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-2xl text-[10px] font-black transition-all flex items-center gap-2 ${
                selectedCategory === cat ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-400 border border-slate-200'
              }`}
            >
              <span>{ICONS[cat] || "✨"}</span> {cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Rankings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {filteredRankings.map((rk) => (
            <div key={rk.id} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col min-h-[400px]">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">
                      {rk.category.startsWith('AI:') ? ICONS.KI : (ICONS[rk.category] || "✨")}
                    </span>
                    <span className="font-black text-xl tracking-tighter uppercase truncate max-w-[150px]">
                      {rk.category.startsWith('AI:') ? rk.category.replace('AI: ', '') : rk.category}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    {new Date(rk.created_at).toLocaleDateString('de-DE')}
                  </span>
                </div>
                <div className="bg-slate-50 px-3 py-1 rounded-full text-[9px] font-black text-slate-400 border border-slate-100">
                  {rk.result.length} SLOTS
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center space-y-1.5">
                {rk.result.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-50/50 px-4 py-2 rounded-xl border border-slate-50">
                    <span className={`text-[10px] font-black ${i === 0 ? 'text-blue-500' : 'text-slate-300'} italic w-4 text-right`}>#{i + 1}</span>
                    <span className="font-bold text-slate-700 text-sm truncate">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}