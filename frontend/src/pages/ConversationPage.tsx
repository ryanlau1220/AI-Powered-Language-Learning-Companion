import React from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import ConversationInterface from '../components/ConversationInterface'

const ConversationPage: React.FC = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const scenario = searchParams.get('scenario') || 'general'

  const handleMessageSent = (message: string) => {
    console.log('Message sent:', message)
    // Message handling is now done in ConversationInterface component
  }

  return (
    <div className="max-w-4xl mx-auto h-screen flex flex-col">
      <div className="card flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {scenario.charAt(0).toUpperCase() + scenario.slice(1)} Conversation
            </h1>
            <p className="text-sm text-gray-500">Practice real-world scenarios</p>
          </div>
        </div>

        <ConversationInterface
          conversationId={id}
          scenario={scenario}
          onMessageSent={handleMessageSent}
        />
      </div>
    </div>
  )
}

export default ConversationPage
