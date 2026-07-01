import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Bot, Send, X, CheckCircle2 } from 'lucide-react'
import api from '../api/client'

const STARTERS = [
  'Which providers are in Medicare?',
  'Who has dual affiliation?',
  'Add Dr. John Smith to Medicare',
  'What agreement applies to ABC Medical Group + CCN?',
  'What does eligibility rule R002 require?',
  'Terminate Dr. Emily Chen\'s Commercial PPO',
]

function usePageContext() {
  const { pathname } = useLocation()
  const providerMatch = pathname.match(/^\/providers\/([^/]+)$/)
  return {
    page: pathname,
    provider_id: providerMatch ? providerMatch[1] : null,
  }
}

export default function ChatBubble({ enabled }) {
  const [isOpen, setIsOpen] = useState(false)
  // Each message: { role, content, actionTaken? }
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const context = usePageContext()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  if (!enabled) return null

  const send = async (text) => {
    const content = (text || input).trim()
    if (!content || loading) return
    setInput('')
    setError('')
    const next = [...messages, { role: 'user', content }]
    setMessages(next)
    setLoading(true)
    try {
      const { reply, actions_taken } = await api.chat(next, context)
      setMessages([...next, { role: 'assistant', content: reply, actionTaken: !!actions_taken }])
      if (actions_taken) {
        // Refresh all live data so Provider Detail, Dashboard, etc. reflect the change
        queryClient.invalidateQueries()
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Could not reach the AI assistant. Please try again.'
      setError(msg)
      setMessages(next)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating trigger button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-sf-dark text-white pl-3.5 pr-4 py-3 rounded-full shadow-xl font-semibold text-[13.5px] hover:bg-[#1a3a70] transition-colors"
        >
          <Bot size={18} />
          Ask AI
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200"
          style={{ width: '340px', height: '500px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 rounded-t-2xl bg-sf-dark text-white shrink-0">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-sf-teal" />
              <div>
                <div className="font-bold text-[13.5px]">Provider Ops Assistant</div>
                <div className="text-[11px] text-white/60">Genzeon AI · read-only</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {messages.length === 0 && (
              <div>
                <p className="text-[12.5px] text-gray-500 text-center mb-3">
                  Ask me anything about the provider data.
                </p>
                <div className="flex flex-col gap-1.5">
                  {STARTERS.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="text-left text-[12px] text-sf-blue bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg border border-blue-100 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-[13px] leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-sf-blue text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  {m.content}
                </div>
                {m.actionTaken && (
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-sf-teal font-semibold">
                    <CheckCircle2 size={12} /> Action taken · screens updated
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-3 rounded-xl rounded-bl-sm">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input row */}
          <div className="px-3 py-3 border-t border-gray-200 flex gap-2 shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ask about providers, networks…"
              disabled={loading}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-sf-blue disabled:bg-gray-50"
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="bg-sf-blue text-white px-3 py-2 rounded-lg disabled:opacity-40 hover:bg-[#0161b5]"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
