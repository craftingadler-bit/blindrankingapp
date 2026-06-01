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

function MultiplayerGame({ room, currentUser, setRoom }: { room: Room, currentUser: User, setRoom: (r: Room) => void }) {
  const router = useRouter()
  const { game_data, current_item_index, current_turn, player_1_id } = room
  const board = game_data.board
  const items = game_data.items
  const slotCount = board.length

  const myPlayerKey = currentUser.id === player_1_id ? 'player_1' : 'player_2'
  const isMyTurn = current_turn === myPlayerKey
  const isFinished = room.status === 'FINISHED'

  const [categories, setCategories] = useState<string[]>([])
  const [loadingRematch, setLoadingRematch] = useState(false)

  useEffect(() => {
    // Lade die Kategorien für den Host, sobald das Spiel vorbei ist
    if (isFinished && myPlayerKey === 'player_1' && categories.length === 0) {
      supabase.from('game_items').select('category').then(({ data, error }) => {
        if (data && !error) {
          const unique = Array.from(new Set(data.map(i => i.category))).filter(c => c !== 'Situationen');
          setCategories(unique);
        }
      })
    }
  }, [isFinished, myPlayerKey, categories.length])

  const startRematch = async (category: string) => {
    setLoadingRematch(true);
    
    // Neue Items für die gewählte Kategorie aus der Datenbank laden
    let query = supabase.from('game_items').select('id, name');
    if (category !== 'RANDOM') query = query.eq('category', category);
    
    const { data: allItems } = await query;
    
    if (!allItems || allItems.length < slotCount) {
       alert('Fehler: Nicht genügend Items für diese Kategorie gefunden.');
       setLoadingRematch(false);
       return;
    }
    const shuffled = [...allItems].sort(() => 0.5 - Math.random());
    const selectedItems = shuffled.slice(0, slotCount).map(i => i.name);
    
    const newGameData = { board: Array(slotCount).fill(null), items: selectedItems };

    // 1. Optimistisches Update: UI springt sofort auf die neue Runde um
    setRoom({
      ...room,
      category: category,
      game_data: newGameData,
      current_item_index: 0,
      current_turn: 'player_1',
      status: 'IN_PROGRESS'
    });

    // 2. Datenbank-Update für Spieler 2 (wird über Realtime synchronisiert)
    await supabase.from('rooms').update({
      category: category,
      game_data: newGameData,
      current_item_index: 0,
      current_turn: 'player_1',
      status: 'IN_PROGRESS'
    }).eq('id', room.id);
    
    setLoadingRematch(false);
  }

  const handleRank = async (slotIndex: number) => {
    if (!isMyTurn || board[slotIndex] !== null || current_item_index >= slotCount) return

    const nextPlayer = current_turn === 'player_1' ? 'player_2' : 'player_1'
    const nextItemIndex = current_item_index + 1
    
    const newBoard = [...board]
    newBoard[slotIndex] = items[current_item_index]

    const newGameData = { ...game_data, board: newBoard }
    const nextStatus = nextItemIndex >= slotCount ? 'FINISHED' : 'IN_PROGRESS'

    // Optimistisches Update: Eigener Klick erscheint sofort
    setRoom({
      ...room,
      game_data: newGameData,
      current_turn: nextPlayer,
      current_item_index: nextItemIndex,
      status: nextStatus
    })

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
        <div className="mt-12 flex flex-col items-center gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center">
            <h3 className="text-2xl font-black italic tracking-tight mb-2">Nächste Runde?</h3>
            <p className="text-slate-500 text-sm">Spielt direkt noch einmal zusammen!</p>
          </div>
          
          {myPlayerKey === 'player_1' ? (
            <div className="w-full max-w-md bg-slate-50 p-4 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Kategorie wählen</p>
              {categories.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {categories.map(cat => (
                     <button
                       key={cat}
                       onClick={() => startRematch(cat)}
                       disabled={loadingRematch}
                       className="text-left px-4 py-3 rounded-2xl bg-white border border-slate-100 font-bold text-sm text-slate-600 hover:text-blue-600 hover:border-blue-500 transition-all flex items-center justify-between group"
                     >
                       <span className="truncate mr-2 text-xs">{cat}</span>
                       <Zap size={14} className="opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity shrink-0" />
                     </button>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center p-4"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 px-8 py-6 rounded-3xl text-center animate-pulse">
              <div className="w-8 h-8 border-4 border-slate-300 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="font-bold text-slate-500">Warte auf Host...</p>
              <p className="text-xs text-slate-400 mt-1">Es wird gerade eine neue Kategorie ausgewählt.</p>
            </div>
          )}
          
          <button 
            onClick={() => router.push('/')} 
            className="text-slate-400 hover:text-slate-900 text-sm font-bold mt-4 transition-colors"
          >
            Raum verlassen
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
      let finalUser = activeUser;

      if (!finalUser) {
        // Falls jemand unangemeldet direkt den Raum aufruft, Gast-Session erstellen
        const { data } = await supabase.auth.signInAnonymously()
        if (!data.user) {
          router.push(`/join/${roomId}`)
          return
        }
        finalUser = data.user;
      }
      setUser(finalUser)

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
      {room.status === 'LOBBY' ? <Lobby room={room} /> : <MultiplayerGame room={room} currentUser={user} setRoom={setRoom} />}
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