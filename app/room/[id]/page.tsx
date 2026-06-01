'use client'

import { useState, useEffect, Suspense, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { QRCodeSVG } from 'qrcode.react'
import { Zap, RotateCcw, Copy } from 'lucide-react'

// Wir definieren die Typen für unsere Raum-Datenbankzeile
interface Room {
  id: string;
  status: 'LOBBY' | 'IN_PROGRESS' | 'FINISHED';
  category: string;
  player_1_id: string;
  player_2_id: string | null;
  current_turn: 'player_1' | 'player_2';
  current_item_index: number;
  game_data: {
    board: (string | null)[];
    items: string[];
  };
  created_at: string;
}

function Lobby({ room }: { room: Room }) {
  const joinUrl = `${window.location.origin}/join/${room.id}`
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="text-center max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-slate-500 mb-4">Raum-Code: <span className="text-5xl font-black text-slate-800 tracking-widest block mt-2">{room.id}</span></h1>
      <p className="text-slate-500 mb-8">Dein Gegner kann den QR-Code scannen oder den Link nutzen, um beizutreten.</p>
      
      <div className="bg-white p-6 rounded-3xl inline-block shadow-lg border border-slate-100 mb-8">
        <QRCodeSVG value={joinUrl} size={192} />
      </div>

      <div className="flex items-center justify-center gap-2 bg-slate-100 p-2 rounded-full">
        <input type="text" value={joinUrl} readOnly className="bg-transparent text-slate-500 text-sm font-mono flex-1 outline-none px-2"/>
        <button onClick={copyToClipboard} className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-colors">
          <Copy size={16} />
        </button>
      </div>
      {copied && <p className="text-green-500 text-xs font-bold mt-2">Link kopiert!</p>}

      <div className="mt-12">
        <div className="w-10 h-10 border-4 border-slate-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="font-black text-slate-400 uppercase text-xs tracking-widest">Warte auf Gegner...</p>
      </div>
    </div>
  )
}

function MultiplayerGame({ room, currentUser }: { room: Room, currentUser: User }) {
  const router = useRouter()
  const { game_data, current_item_index, current_turn, player_1_id } = room
  const board = game_data.board
  const items = game_data.items
  const slotCount = board.length

  const myPlayerKey = currentUser.id === player_1_id ? 'player_1' : 'player_2'
  const isMyTurn = current_turn === myPlayerKey

  const handleRank = async (slotIndex: number) => {
    if (!isMyTurn || board[slotIndex] !== null || current_item_index >= slotCount) return

    const nextPlayer = current_turn === 'player_1' ? 'player_2' : 'player_1'
    const nextItemIndex = current_item_index + 1
    
    const newBoard = [...board]
    newBoard[slotIndex] = items[current_item_index]

    const newGameData = { ...game_data, board: newBoard }
    const nextStatus = nextItemIndex >= slotCount ? 'FINISHED' : 'IN_PROGRESS'

    await supabase
      .from('rooms')
      .update({
        game_data: newGameData,
        current_turn: nextPlayer,
        current_item_index: nextItemIndex,
        status: nextStatus
      })
      .eq('id', room.id)
  }

  const currentItemName = items[current_item_index]
  const isFinished = room.status === 'FINISHED'

  return (
    <main className="min-h-screen bg-white flex flex-col items-center p-6 text-slate-900 w-full">
       <div className="my-10 text-center">
        <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">
          {room.category} {isMyTurn ? "(Du bist dran)" : "(Gegner ist dran)"}
        </p>
        <div className={`font-black lowercase tracking-tighter ${slotCount === 10 ? 'text-4xl' : 'text-5xl'}`}>
          {isFinished ? "Finish 🎉" : currentItemName}
        </div>
      </div>

      <div className={`w-full max-w-sm sm:max-w-md grid gap-2`}>
        {board.map((item, i) => (
          <button 
            key={i} 
            onClick={() => handleRank(i)} 
            disabled={!!item || isFinished || !isMyTurn}
            className={`w-full rounded-2xl border-2 flex items-center justify-between px-6 font-bold transition-all
            ${item ? 'bg-slate-900 text-white border-transparent shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-300'}
            ${!item && isMyTurn && 'hover:border-blue-500 cursor-pointer'}
            ${!isMyTurn && !item && 'cursor-not-allowed'}
            ${slotCount === 10 ? 'h-12 text-sm' : 'h-16 text-lg'}`}
          >
            <span className="italic opacity-50">#{i + 1}</span>
            <span className="truncate ml-4">{item || "platziere hier"}</span>
          </button>
        ))}
      </div>

      {isFinished && (
        <div className="mt-8 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button 
            onClick={() => router.push('/')} 
            className="flex items-center gap-3 bg-slate-900 text-white px-10 py-4 rounded-full font-black shadow-xl hover:bg-blue-600 transition-all uppercase tracking-widest group"
          >
            <Zap size={18} className="group-hover:text-yellow-400 fill-current" />
            Neues Spiel
          </button>
        </div>
      )}
    </main>
  )
}

function RoomPageContent({ roomId }: { roomId: string }) {
  const [room, setRoom] = useState<Room | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAndFetch = async () => {
      const { data: { user: activeUser } } = await supabase.auth.getUser()
      if (!activeUser) {
        router.push(`/login?redirectTo=/join/${roomId}`)
        return
      }
      setUser(activeUser)

      const { data, error } = await supabase.from('rooms').select('*').eq('id', roomId).single()
      if (error || !data) {
        router.push('/')
        return
      }
      setRoom(data as Room)
      setLoading(false)
    }
    checkAndFetch()

    const channel = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, 
      (payload) => {
        setRoom(payload.new as Room)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [roomId, router])

  if (loading || !room || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-black text-slate-400 uppercase tracking-widest text-sm">Lade Raum...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      {room.status === 'LOBBY' ? <Lobby room={room} /> : <MultiplayerGame room={room} currentUser={user} />}
    </div>
  )
}

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Lade Raum...</div>}>
      <RoomPageContent roomId={resolvedParams.id.toUpperCase()} />
    </Suspense>
  )
}