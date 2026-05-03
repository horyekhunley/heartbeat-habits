'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'
import { createClient } from '@/lib/supabase'
import { Heart, Sparkles, ArrowRight, Lock, Plus } from 'lucide-react'
import { setCookie } from 'cookies-next'
import { motion, AnimatePresence } from 'framer-motion'

export default function Onboarding() {
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleCreateRoom = async () => {
    if (!name) return
    setLoading(true)
    const code = nanoid(6).toUpperCase()
    
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({ code })
      .select()
      .single()

    if (roomError) {
      alert(`Error: ${roomError.message}`)
      setLoading(false)
      return
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({ room_id: room.id, name })
      .select()
      .single()

    if (userError) {
      alert(`Error: ${userError.message}`)
      setLoading(false)
      return
    }

    setCookie('room_id', room.id)
    setCookie('user_id', user.id)
    router.push('dashboard/')
  }

  const handleJoinRoom = async () => {
    if (!name || !roomCode) return
    setLoading(true)

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select()
      .eq('code', roomCode.toUpperCase())
      .single()

    if (roomError || !room) {
      alert('Room not found')
      setLoading(false)
      return
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({ room_id: room.id, name })
      .select()
      .single()

    if (userError) {
      alert(`Error: ${userError.message}`)
      setLoading(false)
      return
    }

    setCookie('room_id', room.id)
    setCookie('user_id', user.id)
    router.push('dashboard/')
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden romantic-bg">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-romantic-100/50 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-romantic-100/50 rounded-full blur-3xl" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass rounded-[2.5rem] p-10 relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-block p-4 bg-romantic-50 rounded-3xl mb-6 shadow-inner"
          >
            <Heart className="w-10 h-10 text-romantic-500 fill-romantic-500" />
          </motion.div>
          <h1 className="text-4xl font-serif font-bold text-gray-900 tracking-tight">Heartbeat</h1>
          <p className="text-gray-500 mt-3 font-medium flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-romantic-400" />
            Build habits, grow closer
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-1">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-white/50 border border-romantic-100 focus:ring-4 focus:ring-romantic-50/50 focus:border-romantic-200 outline-none transition-all font-medium text-gray-800"
              placeholder="e.g. Romeo"
            />
          </div>

          <AnimatePresence mode="wait">
            {isJoining && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-1">Secret Room Code</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-white/50 border border-romantic-100 focus:ring-4 focus:ring-romantic-50/50 focus:border-romantic-200 outline-none transition-all font-mono font-bold tracking-[0.2em] text-center text-romantic-600"
                  placeholder="CODE123"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={isJoining ? handleJoinRoom : handleCreateRoom}
            disabled={loading}
            className="w-full py-5 bg-romantic-600 text-white rounded-2xl font-bold shadow-2xl shadow-romantic-200 hover:bg-romantic-700 transition-all flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isJoining ? (
              <><Lock className="w-5 h-5" /> Join Secret Room</>
            ) : (
              <><Plus className="w-5 h-5" /> Create Room</>
            )}
            {!loading && <ArrowRight className="w-5 h-5 opacity-50" />}
          </motion.button>

          <div className="text-center pt-2">
            <button
              onClick={() => setIsJoining(!isJoining)}
              className="text-sm text-romantic-600 hover:text-romantic-800 font-bold tracking-tight transition-colors"
            >
              {isJoining ? 'Wait, I need to create a new room' : 'I already have a code to join'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
