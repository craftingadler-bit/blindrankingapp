'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Zap, Users, ArrowLeft } from 'lucide-react'

export default function MultiplayerScreen() {
  const router = useRouter()
  
  return (
    <main className="min-h-screen bg-white flex flex-col p-6 lg:p-12 text-slate-900">
      <div className="max-w-5xl mx-auto w-full mt-10">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-slate-400 hover:text-blue-600 transition-colors mb-12">
          <ArrowLeft size={20} /> Zurück
        </Link>
        
        <h1 className="text-5xl lg:text-7xl font-black italic tracking-tighter mb-4">
          MULTI<span className="text-blue-600">PLAYER</span>
        </h1>
        <p className="text-slate-500 font-bold mb-12">Wähle deinen Spielmodus.</p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Modus 1: Wechsel-Duell */}
          <button 
            onClick={() => router.push('/multiplayer/duel')}
            className="group relative bg-slate-50 border-2 border-slate-100 rounded-3xl p-8 hover:border-blue-600 hover:bg-white transition-all text-left overflow-hidden shadow-sm hover:shadow-xl"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-100 group-hover:text-blue-600 transition-all transform group-hover:scale-110">
              <Zap size={80} />
            </div>
            <h2 className="text-2xl font-black italic tracking-tight mb-2">Wechsel-Duell</h2>
            <p className="text-slate-500 font-medium text-sm mb-6 max-w-[80%] relative z-10">
              Spiele 1vs1 gegen einen Freund. Ihr teilt euch ein Board mit Slots und wählt abwechselnd. Wer behält die Nerven?
            </p>
            <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest group-hover:bg-blue-600 transition-colors">
              Modus wählen
            </div>
          </button>
          
          {/* Modus 2: Party */}
          <button 
            disabled
            className="group relative bg-slate-50 border-2 border-slate-100 rounded-3xl p-8 opacity-70 cursor-not-allowed text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Users size={80} />
            </div>
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
              Bald verfügbar
            </div>
            <h2 className="text-2xl font-black italic tracking-tight mb-2 text-slate-400">Party-Modus</h2>
            <p className="text-slate-400 font-medium text-sm mb-6 max-w-[80%] relative z-10">
              Spiele mit bis zu 8 Leuten gleichzeitig. Jeder hat sein eigenes Board, am Ende werden die Ergebnisse verglichen.
            </p>
          </button>
        </div>
      </div>
    </main>
  )
}
