import React, { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react'

interface ConversationInterfaceProps {
  conversationId?: string
  scenario?: string
  onMessageSent?: (message: string) => void
}

const ConversationInterface: React.FC<ConversationInterfaceProps> = ({
  conversationId,
  scenario = 'general',
  onMessageSent
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai' as const,
      content: `Hello! I'm your AI language learning tutor. Let's practice ${scenario} conversations. What would you like to talk about?`,
      timestamp: new Date().toISOString()
    }
  ])
  const [isPlaying, setIsPlaying] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!message.trim()) return

    const newMessage = {
      id: messages.length + 1,
      type: 'user' as const,
      content: message,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, newMessage])
    onMessageSent?.(message)
    setMessage('')

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        type: 'ai' as const,
        content: "That's interesting! Tell me more about that.",
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, aiResponse])
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // TODO: Implement actual recording functionality
  }

  const playAudio = (text: string) => {
    setIsPlaying(true)
    // TODO: Implement text-to-speech
    console.log('Playing audio for:', text)
    setTimeout(() => setIsPlaying(false), 2000)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs opacity-70">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
                {msg.type === 'ai' && (
                  <button
                    onClick={() => playAudio(msg.content)}
                    disabled={isPlaying}
                    className="ml-2 p-1 rounded-full hover:bg-gray-200 disabled:opacity-50"
                  >
                    {isPlaying ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <button
            onClick={toggleRecording}
            className={`p-2 rounded-full ${
              isRecording 
                ? 'bg-red-100 text-red-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="input-field flex-1"
          />
          
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        {/* Recording indicator */}
        {isRecording && (
          <div className="mt-2 flex items-center space-x-2 text-red-600">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
            <span className="text-sm">Recording...</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ConversationInterface
