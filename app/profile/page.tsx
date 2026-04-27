'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { User } from '@supabase/supabase-js' // Import für den User-Typ

// Definiere ein Interface für deine Rankings
interface Ranking {
  id: string
  category: string
  result: string[]
  created_at: string
  user_id: string
}

const ICONS: Record<string, string> = {
  Fussball: "⚽",
  Filme: "🍿",
  Essen: "🍔",
  RANDOM: "🎲"
}

export default function ProfilePage() {
  // Fix: Echte Typen statt 'any'
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
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

      if (error) {
        console.error("Fehler beim Laden:", error.message)
      } else {
        setRankings(data || [])
      }
      
      setLoading(false)
    }

    fetchData()
  }, [router])

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold">Lade deine History...</div>

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => router.push('/')} 
          className="mb-8 font-bold text-slate-400 hover:text-black transition-colors"
        >
          ← ZURÜCK
        </button>

        <div className="mb-12">
          <h1 className="text-4xl font-black tracking-tight">Meine Rankings</h1>
          <p className="text-slate-500 font-medium">{user?.email}</p>
        </div>

        <div className="space-y-6">
          {rankings.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl text-center border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold text-lg">Noch keine Spiele absolviert.</p>
              <button 
                onClick={() => router.push('/')}
                className="mt-4 text-blue-600 font-bold hover:underline"
              >
                Jetzt das erste Spiel starten →
              </button>
            </div>
          ) : (
            rankings.map((rk) => (
              /* Fix: rounded-4xl statt rounded-[2rem] */
              <div key={rk.id} className="bg-white p-6 rounded-4xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{ICONS[rk.category] || "✨"}</span>
                    <span className="font-black text-xl uppercase tracking-tighter">{rk.category}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-300">
                    {new Date(rk.created_at).toLocaleDateString('de-DE')}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {rk.result.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                      <span className="text-xs font-black text-slate-300 italic">#{i + 1}</span>
                      <span className="font-bold text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  )
}