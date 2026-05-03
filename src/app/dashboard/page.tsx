'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { getCookie } from 'cookies-next'
import { 
  Heart, Plus, Send, Smile, Calendar, Quote, 
  CheckCircle2, Circle, Settings, Share2, 
  LayoutDashboard, HeartHandshake, PenLine
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [partner, setPartner] = useState<any>(null)
  const [room, setRoom] = useState<any>(null)
  const [habits, setHabits] = useState<any[]>([])
  const [partnerHabits, setPartnerHabits] = useState<any[]>([])
  const [completions, setCompletions] = useState<Record<string, boolean>>({})
  const [partnerCompletions, setPartnerCompletions] = useState<Record<string, boolean>>({})
  const [note, setNote] = useState('')
  const [partnerNote, setPartnerNote] = useState<any>(null)
  const [newHabitTitle, setNewHabitTitle] = useState('')
  const [showHeartBurst, setShowHeartBurst] = useState(false)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()
  const roomId = getCookie('room_id') as string
  const userId = getCookie('user_id') as string

  const fetchData = useCallback(async () => {
    if (!roomId || !userId) return

    const { data: roomData } = await supabase.from('rooms').select().eq('id', roomId).single()
    const { data: usersData } = await supabase.from('users').select().eq('room_id', roomId)
    
    setRoom(roomData)
    const currentUser = usersData?.find(u => u.id === userId)
    const otherUser = usersData?.find(u => u.id !== userId)
    setUser(currentUser)
    setPartner(otherUser)

    const { data: allHabits } = await supabase.from('habits').select().eq('room_id', roomId)
    setHabits(allHabits?.filter(h => h.user_id === userId) || [])
    setPartnerHabits(allHabits?.filter(h => h.user_id !== userId) || [])

    const today = new Date().toISOString().split('T')[0]
    const { data: allCompletions } = await supabase
      .from('completions')
      .select('habit_id')
      .eq('completed_at', today)
    
    const compMap: Record<string, boolean> = {}
    allCompletions?.forEach(c => compMap[c.habit_id] = true)
    setCompletions(compMap)

    const { data: notesData } = await supabase
      .from('notes')
      .select()
      .eq('room_id', roomId)
      .eq('date', today)
    
    const myN = notesData?.find(n => n.user_id === userId)
    const pN = notesData?.find(n => n.user_id !== userId)
    if (myN) setNote(myN.content)
    setPartnerNote(pN)

    setLoading(false)
  }, [roomId, userId, supabase])

  useEffect(() => {
    fetchData()

    const nudgeChannel = supabase.channel(`room:${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'nudges', filter: `room_id=eq.${roomId}` }, (payload) => {
        if (payload.new.from_user_id !== userId) {
          setShowHeartBurst(true)
          setTimeout(() => setShowHeartBurst(false), 3000)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(nudgeChannel)
    }
  }, [fetchData, roomId, userId, supabase])

  const toggleHabit = async (habitId: string) => {
    const today = new Date().toISOString().split('T')[0]
    if (completions[habitId]) {
      await supabase.from('completions').delete().eq('habit_id', habitId).eq('completed_at', today)
      setCompletions(prev => ({ ...prev, [habitId]: false }))
    } else {
      await supabase.from('completions').insert({ habit_id: habitId, completed_at: today })
      setCompletions(prev => ({ ...prev, [habitId]: true }))
    }
  }

  const addHabit = async () => {
    if (!newHabitTitle) return
    const { data } = await supabase
      .from('habits')
      .insert({ room_id: roomId, user_id: userId, title: newHabitTitle })
      .select()
      .single()
    if (data) {
      setHabits(prev => [...prev, data])
      setNewHabitTitle('')
    }
  }

  const saveNote = async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data: existing } = await supabase
      .from('notes')
      .select()
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    if (existing) {
      await supabase.from('notes').update({ content: note }).eq('id', existing.id)
    } else {
      await supabase.from('notes').insert({ room_id: roomId, user_id: userId, content: note, date: today })
    }
  }

  const sendNudge = async () => {
    await supabase.from('nudges').insert({ room_id: roomId, from_user_id: userId })
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center romantic-bg">
      <div className="relative">
        <Heart className="w-16 h-16 text-romantic-500 fill-romantic-500 animate-pulse" />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-romantic-200 rounded-full -z-10 blur-xl"
        />
      </div>
    </div>
  )

  const myProgress = habits.length > 0 ? (habits.filter(h => completions[h.id]).length / habits.length) * 100 : 0

  return (
    <div className="min-h-screen bg-[#FFFBFB] pb-20 font-sans selection:bg-romantic-100">
      {/* Heart Burst Overlay */}
      <AnimatePresence>
        {showHeartBurst && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center bg-romantic-500/10 backdrop-blur-[2px]"
          >
            <div className="relative">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, scale: 0, rotate: 0 }}
                  animate={{ 
                    x: (Math.random() - 0.5) * 600, 
                    y: (Math.random() - 0.5) * 600, 
                    scale: Math.random() * 1.5,
                    rotate: Math.random() * 360,
                    opacity: 0 
                  }}
                  transition={{ duration: 2.5, ease: "easeOut" }}
                  className="absolute"
                >
                  <Heart className="text-romantic-500 fill-romantic-500 w-8 h-8" />
                </motion.div>
              ))}
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.5, 1] }}
                transition={{ duration: 0.6 }}
                className="bg-white p-8 rounded-full shadow-2xl"
              >
                <Heart className="text-romantic-600 fill-romantic-600 w-20 h-20" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="px-8 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-romantic-100 rounded-2xl">
            <Heart className="w-6 h-6 text-romantic-600 fill-romantic-600" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 tracking-tight">Heartbeat</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-romantic-50 shadow-sm">
            <Share2 className="w-4 h-4 text-romantic-400" />
            <span className="text-xs font-mono font-bold text-romantic-600 tracking-widest">{room?.code}</span>
          </div>
          <button className="p-2 text-gray-400 hover:text-romantic-500 transition-colors">
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
        {/* Left Column: Progress & Stats */}
        <div className="lg:col-span-4 space-y-8">
          <section className="glass rounded-[2.5rem] p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <HeartHandshake className="w-32 h-32" />
            </div>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-romantic-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-romantic-200">
                {user?.name?.[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                <p className="text-sm font-medium text-gray-400">Your Progress</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative pt-1">
                <div className="flex mb-4 items-center justify-between">
                  <div>
                    <span className="text-xs font-bold inline-block py-1 px-3 uppercase rounded-full text-romantic-600 bg-romantic-50 tracking-widest">
                      Daily Goal
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold inline-block text-romantic-600">
                      {Math.round(myProgress)}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-romantic-50 border border-romantic-100/50">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${myProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-romantic-500 rounded-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/50 p-4 rounded-3xl border border-romantic-50">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Habits</p>
                  <p className="text-2xl font-bold text-gray-900">{habits.length}</p>
                </div>
                <div className="bg-white/50 p-4 rounded-3xl border border-romantic-50">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Streak</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
              </div>
            </div>
          </section>

          {partner && (
            <motion.section 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-romantic-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-romantic-200 relative overflow-hidden"
            >
              <div className="absolute -right-8 -bottom-8 opacity-10">
                <Heart className="w-48 h-48 fill-white" />
              </div>
              
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white text-lg font-bold">
                    {partner.name[0].toUpperCase()}
                  </div>
                  <p className="font-bold text-lg">{partner.name}</p>
                </div>
                <button 
                  onClick={sendNudge}
                  className="p-3 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-all active:scale-90"
                >
                  <Smile className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 relative z-10">
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Partner's Progress</p>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white w-[65%] rounded-full" />
                </div>
                <p className="text-sm font-medium italic text-white/80">"Keep going, my love! You're doing great."</p>
              </div>
            </motion.section>
          )}
        </div>

        {/* Middle Column: Habits */}
        <div className="lg:col-span-5">
          <section className="space-y-6">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-xl font-serif font-bold text-gray-900 flex items-center gap-3">
                <LayoutDashboard className="w-5 h-5 text-romantic-500" />
                Daily Rituals
              </h3>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>

            <div className="space-y-4">
              {habits.map((habit, i) => (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => toggleHabit(habit.id)}
                  className={cn(
                    "group cursor-pointer p-6 rounded-[2rem] border transition-all flex items-center justify-between",
                    completions[habit.id] 
                      ? "bg-romantic-50/50 border-romantic-100 shadow-sm" 
                      : "bg-white border-gray-100 hover:border-romantic-200"
                  )}
                >
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                      completions[habit.id] ? "bg-romantic-500 text-white" : "bg-gray-50 text-gray-300 group-hover:text-romantic-300"
                    )}>
                      {completions[habit.id] ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                    </div>
                    <span className={cn(
                      "text-lg font-bold transition-all",
                      completions[habit.id] ? "text-romantic-900 line-through opacity-50" : "text-gray-700"
                    )}>
                      {habit.title}
                    </span>
                  </div>
                  <Heart className={cn(
                    "w-5 h-5 transition-all",
                    completions[habit.id] ? "text-romantic-500 fill-romantic-500 scale-125" : "text-gray-200 opacity-0 group-hover:opacity-100"
                  )} />
                </motion.div>
              ))}

              <div className="relative group">
                <input
                  type="text"
                  value={newHabitTitle}
                  onChange={(e) => setNewHabitTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addHabit()}
                  placeholder="Create a new shared ritual..."
                  className="w-full pl-6 pr-16 py-6 bg-white border border-dashed border-gray-200 rounded-[2rem] outline-none focus:border-romantic-300 focus:ring-4 focus:ring-romantic-50/50 transition-all font-medium text-gray-600 placeholder:text-gray-300"
                />
                <button 
                  onClick={addHabit}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-romantic-50 text-romantic-600 rounded-2xl hover:bg-romantic-100 transition-colors"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Love Notes */}
        <div className="lg:col-span-3 space-y-8">
          <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 space-y-6">
            <h3 className="text-lg font-serif font-bold text-gray-900 flex items-center gap-3">
              <PenLine className="w-5 h-5 text-romantic-500" />
              Love Note
            </h3>
            
            <div className="relative">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onBlur={saveNote}
                placeholder="Write something sweet..."
                className="w-full h-48 p-6 bg-cream-50 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-romantic-50/30 text-gray-700 font-medium leading-relaxed resize-none border-none placeholder:text-gray-300"
              />
              <div className="absolute bottom-4 right-4 text-[10px] font-bold text-romantic-300 uppercase tracking-tighter">
                Today
              </div>
            </div>
            
            <button 
              onClick={saveNote}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors"
            >
              <Send className="w-4 h-4" /> Save Note
            </button>
          </section>

          <AnimatePresence>
            {partnerNote && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] border border-romantic-100 p-8 shadow-xl shadow-romantic-100/20 relative"
              >
                <Quote className="absolute top-6 left-6 w-10 h-10 text-romantic-50 opacity-50" />
                <div className="relative z-10">
                  <p className="text-xs font-bold text-romantic-400 mb-4 uppercase tracking-[0.2em]">Message received</p>
                  <p className="text-gray-800 font-medium italic leading-relaxed text-lg">
                    "{partnerNote.content}"
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-romantic-50 rounded-full flex items-center justify-center">
                      <Heart className="w-4 h-4 text-romantic-500 fill-romantic-500" />
                    </div>
                    <span className="text-xs font-bold text-gray-400">{partner?.name}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
