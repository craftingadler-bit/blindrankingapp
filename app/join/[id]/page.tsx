'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function JoinPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [message, setMessage] = useState('Trete Raum bei...')

  useEffect(() => {
    const joinRoom = async () => {
      const roomId = resolvedParams.id.toUpperCase()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Wenn der User nicht eingeloggt ist, zum Login schicken und danach hierher zurückkehren.
        router.push(`/login?redirectTo=/join/${roomId}`)
        return
      }

      // Raumdaten abrufen
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      if (roomError || !room) {
        setMessage('Raum nicht gefunden. Du wirst zur Startseite weitergeleitet.')
        setTimeout(() => router.push('/'), 3000)
        return
      }

      // Verhindern, dass der Ersteller sich selbst als Spieler 2 beitritt
      if (room.player_1_id === user.id) {
        router.push(`/rooms/${roomId}`) // Einfach zur Lobby/Spiel weiterleiten
        return
      }
      
      if (room.player_2_id && room.player_2_id !== user.id) {
        setMessage('Dieser Raum ist bereits voll.')
        return
      }

      // Spieler 2 eintragen und Spielstatus auf "IN_PROGRESS" setzen
      const { error: updateError } = await supabase
        .from('rooms')
        .update({ player_2_id: user.id, status: 'IN_PROGRESS' })
        .eq('id', roomId)

      if (updateError) {
        setMessage(`Fehler beim Beitreten: ${updateError.message}`)
      } else {
        router.push(`/rooms/${roomId}`) // Erfolgreich beigetreten, Weiterleitung zum Spiel
      }
    }

    joinRoom()
  }, [resolvedParams.id, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-black text-slate-400 uppercase text-xs tracking-widest text-center">{message}</p>
    </div>
  )
}