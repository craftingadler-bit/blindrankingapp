'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { ICONS } from '../../lib/icons'
import { User } from '@supabase/supabase-js'

// 1. Definition der sensiblen Kategorien (identisch zur Home-Page)
const SENSITIVE_CATEGORIES = [
  "Orte für Sex", 
  "Sexstellungen", 
  "Attraktivität"
];

interface ItemStat {
  item_name: string
  category: string
  avg_rank: number
  times_ranked: number
}

interface CatStat {
  category: string
  play_count: number
}

export default function StatsPage() {
  const [itemStats, setItemStats] = useState<ItemStat[]>([])
  const [catStats, setCatStats] = useState<CatStat[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  // Admin-Check Logik
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isAdmin = !!user && !!adminEmail && user.email === adminEmail;

  useEffect(() => {
    const fetchStats = async () => {
      // User laden für Admin-Check
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData.user);

      const [items, cats] = await Promise.all([
        supabase.from('global_item_stats').select('*'),
        supabase.from('category_popularity').select('*').limit(20) // Mehr laden, da wir gleich filtern
      ])

      if (items.data) setItemStats(items.data)
      if (cats.data) setCatStats(cats.data)
      setLoading(false)
    }
    fetchStats()
  }, [])

  // 2. Hilfsfunktion zum Gruppieren & Filtern der Items nach Kategorie
  const groupedItems = itemStats.reduce((acc, item) => {
    // Filter: Nur hinzufügen, wenn Admin oder Kategorie nicht sensibel
    if (isAdmin || !SENSITIVE_CATEGORIES.includes(item.category)) {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
    }
    return acc;
  }, {} as Record<string, ItemStat[]>);

  // 3. Filter für die Popularitäts-Liste (Rechte Seite)
  const filteredCatStats = catStats.filter(cat => isAdmin || !SENSITIVE_CATEGORIES.includes(cat.category)).slice(0, 10);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-black text-slate-400 uppercase text-xs tracking-widest text-center">Trends werden berechnet...</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 text-slate-900">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => router.push('/')} className="mb-12 font-black text-slate-400 hover:text-black text-xs tracking-widest flex items-center gap-2">
          ← BACK TO HOME
        </button>

        <h1 className="text-6xl md:text-7xl font-black tracking-tighter mb-16 italic">
          Global <span className="text-blue-600">Trends</span>
          {isAdmin && <span className="text-xs ml-4 text-slate-400 not-italic uppercase tracking-widest">Admin View</span>}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          
          {/* Linke Seite: Items gruppiert nach Kategorien */}
          <div className="lg:col-span-3 space-y-12">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-8">Bestbewertete Items nach Kategorie</h2>
            
            {Object.keys(groupedItems).sort().map((category) => (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">{ICONS[category] || "✨"}</span>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900">{category}</h3>
                  <div className="h-[2px] flex-1 bg-slate-100 rounded-full ml-4"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedItems[category].slice(0, 4).map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-lg leading-tight truncate pr-4">{stat.item_name}</span>
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">
                          {stat.times_ranked} globale Rankings
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-black text-blue-600">#{stat.avg_rank}</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Ø Rank</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Rechte Seite: Meistgespielt (Sidebar-Style) */}
          <div className="space-y-8">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-8">Popularität</h2>
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6 sticky top-12">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4">Most Played</p>
              {filteredCatStats.map((cat, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl group-hover:scale-125 transition-transform">{ICONS[cat.category] || "✨"}</span>
                    <span className="font-black text-xs uppercase tracking-tighter text-slate-600 group-hover:text-blue-600 transition-colors">{cat.category}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 bg-slate-50 px-3 py-1 rounded-full">
                    {cat.play_count}x
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}