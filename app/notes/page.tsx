'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface Note {
  id: number;
  text: string;
}

export default function IdeasPage() {
  const router = useRouter()
  const [noteText, setNoteText] = useState('')
  const [notes, setNotes] = useState<Note[]>([])

  // Lädt die gespeicherten Notizen beim Start der Seite
  useEffect(() => {
    const saved = localStorage.getItem('blindrank_notes')
    if (saved) {
      try { setNotes(JSON.parse(saved)) } catch (e) {}
    }
  }, [])

  const handleSave = () => {
    if (!noteText.trim()) return
    const newNotes = [{ id: Date.now(), text: noteText.trim() }, ...notes]
    setNotes(newNotes)
    localStorage.setItem('blindrank_notes', JSON.stringify(newNotes))
    setNoteText('')
  }

  const handleDelete = (id: number) => {
    const newNotes = notes.filter(n => n.id !== id)
    setNotes(newNotes)
    localStorage.setItem('blindrank_notes', JSON.stringify(newNotes))
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="mb-8 font-bold text-slate-400 hover:text-black transition-colors"
        >
          ← ZURÜCK ZUR STARTSEITE
        </button>

        <div className="mb-12">
          <h1 className="text-4xl font-black tracking-tight">Meine Ideen</h1>
          <p className="text-slate-500 font-medium">
            Ein einfacher Ort, um deine Gedanken und Ideen für neue Rankings festzuhalten.
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-8">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Schreibe hier deine Ideen für neue Kategorien oder AI-Rankings auf..."
            className="w-full h-32 p-4 rounded-lg outline-none font-medium text-lg text-slate-800 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 transition-colors resize-none mb-4"
          />
          <div className="flex justify-end">
            <button 
              onClick={handleSave}
              className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition-all shadow-md"
            >
              Idee speichern
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {notes.map(note => (
            <div key={note.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-start gap-4">
              <p className="text-slate-800 font-medium whitespace-pre-wrap">{note.text}</p>
              <button 
                onClick={() => handleDelete(note.id)}
                className="text-red-500 hover:text-red-700 font-bold text-sm bg-red-50 hover:bg-red-100 px-3 py-1 rounded-full transition-colors shrink-0"
              >
                Löschen
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}