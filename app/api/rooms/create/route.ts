import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * Generiert einen zufälligen, lesbaren Raum-Code.
 * @param length Die Länge des Codes (Standard: 4).
 * @returns Ein Code wie "A8F3".
 */
function generateRoomCode(length: number = 4): string {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; // O und 0 zur besseren Lesbarkeit entfernt
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader) {
      console.error("Fehler: Kein Authorization Header gefunden");
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Fehler bei User-Abfrage:", userError);
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { category, slots } = await req.json();
    console.log(`Versuche Raum zu erstellen: Kategorie = ${category}, Slots = ${slots}, User = ${user.id}`);

    if (!category || !slots) {
      return NextResponse.json({ error: 'Kategorie und Slot-Anzahl werden benötigt' }, { status: 400 })
    }

    let query = supabase.from('game_items').select('id, name');
    if (category !== 'RANDOM') {
      query = query.eq('category', category);
    }
    const { data: allItems, error: itemsError } = await query;

    if (itemsError) {
      console.error("Supabase Items Error:", itemsError);
      return NextResponse.json({ error: `DB-Fehler (game_items): ${itemsError.message}` }, { status: 500 });
    }

    if (!allItems || allItems.length < slots) {
      console.error(`Zu wenige Items. Gefunden: ${allItems?.length}, Benötigt: ${slots}`);
      return NextResponse.json({ error: `Nicht genügend Items für diese Kategorie (Gefunden: ${allItems?.length || 0})` }, { status: 500 });
    }

    const shuffled = [...allItems].sort(() => 0.5 - Math.random());
    const selectedItems = shuffled.slice(0, slots);

    let roomCode = '';
    let roomExists = true;
    while (roomExists) {
      roomCode = generateRoomCode();
      // Wichtig: maybeSingle() nutzen, um Fehler zu vermeiden, wenn noch kein Raum mit dem Code existiert
      const { data: existingRoom } = await supabase.from('rooms').select('id').eq('id', roomCode).maybeSingle();
      if (!existingRoom) {
        roomExists = false;
      }
    }

    const gameData = {
      board: Array(slots).fill(null),
      items: selectedItems.map(item => item.name),
    };

    console.log(`Füge Raum in DB ein. Code: ${roomCode}`);

    const { data: newRoom, error: insertError } = await supabase
      .from('rooms')
      .insert({
        id: roomCode,
        game_mode: `DUEL_${slots}`,
        category: category,
        player_1_id: user.id,
        status: 'LOBBY',
        current_turn: 'player_1',
        current_item_index: 0,
        game_data: gameData,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Supabase Insert Error (rooms):", insertError);
      return NextResponse.json({ error: `Fehler beim Speichern in DB: ${insertError.message}` }, { status: 500 });
    }

    console.log(`Raum erfolgreich erstellt: ${newRoom.id}`);
    return NextResponse.json({ roomId: newRoom.id });

  } catch (error) {
    console.error("Kritischer Fehler in der Route:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Kritischer Fehler: ${errorMessage}` }, { status: 500 });
  }
}
