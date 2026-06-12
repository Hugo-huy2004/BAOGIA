import { useEffect, useRef, useCallback } from 'react'
import { useWellnessStore } from '../stores/wellnessStore'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws'

export function useIoT(email) {
  const wsRef = useRef(null)
  const addIoTVital = useWellnessStore(s => s.addIoTVital)
  const setIoTVitals = useWellnessStore(s => s.setIoTVitals)

  const connect = useCallback(() => {
    if (!email || wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(email)}`)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'vital') addIoTVital(data.payload)
        if (data.type === 'vitals_history') setIoTVitals(data.payload)
      } catch {}
    }

    ws.onclose = () => {
      setTimeout(connect, 5000) // Auto-reconnect after 5s
    }

    return () => ws.close()
  }, [email, addIoTVital, setIoTVitals])

  useEffect(() => {
    const cleanup = connect()
    return cleanup
  }, [connect])

  const sendMessage = useCallback((msg) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  return { sendMessage, isConnected: wsRef.current?.readyState === WebSocket.OPEN }
}
