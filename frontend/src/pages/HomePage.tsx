import React, { useState } from 'react'
import { Sparkles, BookOpen, Mic, Headphones, PenTool, MessageCircle, Target, TrendingUp } from 'lucide-react'
import AITutorRoom from '../components/AITutorRoom'

const HomePage: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'tutor-room'>('home')

  const features = [
    {
      icon: Sparkles,
      title: 'AI Tutor Room',
      description: 'Enter the immersive AI learning environment where all skills are integrated into one seamless conversation experience.',
      view: 'tutor-room' as const,
      color: 'bg-gradient-to-r from-indigo-500 to-purple-600',
      hoverColor: 'hover:from-indigo-600 hover:to-purple-700',
      isMain: true
    },
    {
      icon: Mic,
      title: 'Speaking Practice',
      description: 'Practice pronunciation and conversation with real-time feedback.',
      view: 'tutor-room' as const,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600'
    },
    {
      icon: Headphones,
      title: 'Listening Practice',
      description: 'Improve listening skills with contextual audio content.',
      view: 'tutor-room' as const,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      icon: BookOpen,
      title: 'Reading Practice',
      description: 'Enhance reading comprehension with AI-generated content.',
      view: 'tutor-room' as const,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600'
    },
    {
      icon: PenTool,
      title: 'Writing Practice',
      description: 'Develop writing skills with grammar and style feedback.',
      view: 'tutor-room' as const,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    }
  ]

  const handleFeatureClick = (view: 'tutor-room') => {
    setCurrentView(view)
  }

  const handleBackToHome = () => {
    setCurrentView('home')
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'tutor-room':
        return <AITutorRoom onBack={handleBackToHome} />
      default:
        return null
    }
  }

  if (currentView !== 'home') {
    return renderCurrentView()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
         {/* Header */}
         <div className="text-center mb-16">
           <div className="flex items-center justify-center mb-6">
             <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4">
               <Sparkles className="w-8 h-8 text-white" />
             </div>
             <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
               AI Language Learning Companion
             </h1>
           </div>
           <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
             Experience the future of language learning with our immersive AI Tutor Room. 
             All learning modes integrated into one seamless, intelligent conversation experience.
           </p>
         </div>

        {/* Learning Modes Grid */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold text-gray-800 text-center mb-8">
            Integrated Learning Modes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.slice(1).map((feature, index) => (
              <div
                key={index}
                onClick={() => handleFeatureClick('tutor-room')}
                className={`${feature.color} ${feature.hoverColor} p-6 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl group`}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-white">{feature.title}</h4>
                </div>
                <p className="text-white/90 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Feature - AI Tutor Room */}
        <div className="mb-16">
          <div
            onClick={() => handleFeatureClick('tutor-room')}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">AI Tutor Room</h2>
                  <p className="text-white/90 text-lg max-w-2xl">
                    Enter the immersive learning environment where speaking, reading, writing, and listening 
                    are seamlessly integrated into one intelligent conversation experience.
                  </p>
                </div>
              </div>
              <div className="text-white/60 group-hover:text-white transition-colors">
                <MessageCircle className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage