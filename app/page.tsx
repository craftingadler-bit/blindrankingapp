import Link from 'next/link';
import { CATEGORIES } from './constants';

// Emojis für die Optik zuordnen
const ICONS: Record<string, string> = {
  Fussball: "⚽",
  Filme: "🍿",
  Essen: "🍔",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-900 selection:bg-blue-200">
      
      {/* Hero Section */}
      <div className="text-center mb-16 space-y-4">
        <div className="inline-block bg-blue-100 text-blue-700 font-bold px-4 py-1.5 rounded-full text-sm mb-4 tracking-wide">
          v1.0 Live
        </div>
        <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-slate-900">
          Blind<span className="text-blue-600">Rank</span>
        </h1>
        <p className="text-lg text-slate-500 font-medium max-w-md mx-auto">
          Das ultimative Ranking-Spiel. Wähle eine Kategorie und vertraue deinem Instinkt.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Game - Große Karte */}
        <Link 
          href="/game?cat=RANDOM" 
          className="md:col-span-3 relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white p-10 rounded-[2rem] shadow-2xl hover:-translate-y-1 hover:shadow-blue-900/20 transition-all duration-300 group"
        >
          <div className="relative z-10">
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-sm">Featured</span>
            <h2 className="text-4xl font-black mt-6 mb-2">Main Game 🎲</h2>
            <p className="text-slate-300 text-lg">Der pure Chaos-Modus. Ein zufälliger Mix aus allen verfügbaren Kategorien.</p>
          </div>
          {/* Dekorativer Hintergrund-Kreis */}
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
        </Link>

        {/* Kategorie Karten */}
        {Object.keys(CATEGORIES).map((cat) => (
          <Link 
            key={cat} 
            href={`/game?cat=${cat}`} 
            className="bg-white border border-slate-200 p-8 rounded-[2rem] hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
          >
            <div className="text-4xl mb-6">{ICONS[cat] || "✨"}</div>
            <div>
              <h3 className="text-2xl font-bold mb-1">{cat}</h3>
              <p className="text-slate-500 text-sm font-medium">10 Items</p>
            </div>
            
            <div className="mt-6 flex justify-end">
              <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-blue-600 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                →
              </div>
            </div>
          </Link>
        ))}

      </div>
    </main>
  );
}