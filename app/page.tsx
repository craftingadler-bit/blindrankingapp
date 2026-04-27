'use client'
import { useState } from 'react'

const ITEMS = ["Pizza", "Sushi", "Döner", "Burger", "Pasta"]

export default function Home() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING'>('START')
  const [index, setIndex] = useState(0)
  const [slots, setSlots] = useState<(string | null)[]>(Array(5).fill(null))

  const startGame = () => {
    // Liste mischen für echtes Blind Ranking
    ITEMS.sort(() => Math.random() - 0.5)
    setGameState('PLAYING')
  }

  const handleRank = (slotIdx: number) => {
    if (slots[slotIdx] || index >= ITEMS.length) return
    const newSlots = [...slots]
    newSlots[slotIdx] = ITEMS[index]
    setSlots(newSlots)
    setIndex(index + 1)
  }

  // --- STARTSEITE ---
  if (gameState === 'START') {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-500 to-indigo-700 text-white p-6 text-center">
        <h1 className="text-5xl font-extrabold mb-4 drop-shadow-md">Blind Ranker</h1>
        <p className="text-lg mb-10 opacity-90">Ordne die Begriffe, ohne zu wissen, was als Nächstes kommt!</p>
        <button 
          onClick={startGame}
          className="bg-white text-blue-600 px-10 py-4 rounded-full font-bold text-xl shadow-2xl hover:scale-105 transition-transform"
        >
          Spiel starten
        </button>
      </main>
    )
  }

  // --- SPIELSEITE ---
  return (
    <main className="flex flex-col items-center min-h-screen p-8 bg-gray-50 text-gray-900">
      <button onClick={() => setGameState('START')} className="self-start text-sm text-gray-500 mb-4">← Zurück</button>
      
      <div className="w-64 h-32 flex items-center justify-center bg-blue-600 text-white text-2xl font-bold rounded-2xl shadow-xl mb-12">
        {index < ITEMS.length ? ITEMS[index] : "Fertig! 🎉"}
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        {slots.map((item, i) => (
          <button key={i} onClick={() => handleRank(i)}
            className={`h-14 border-2 rounded-xl flex items-center px-4 font-semibold transition-all
              ${item ? 'bg-green-100 border-green-500' : 'bg-white border-gray-300 hover:border-blue-500'}`}>
            <span className="mr-4 text-gray-400">{i + 1}</span>
            {item || "???"}
          </button>
        ))}
      </div>
    </main>
  )
}