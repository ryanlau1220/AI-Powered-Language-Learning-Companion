import React, { useState } from 'react'
import { Sparkles, BookOpen, Mic, MessageCircle } from 'lucide-react'
import AITutorRoom from '../components/AITutorRoom'
import SpeakingMode from '../components/SpeakingMode'
import ReadingMode from '../components/ReadingMode'
import { useLanguage } from '../contexts/LanguageContext'

const HomePage: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'tutor-room' | 'speaking' | 'reading'>('home')
  const { translate } = useLanguage()

  const features = [
    {
      icon: Sparkles,
      title: translate('aiTutor.title', 'AI Tutor Room'),
      description: translate('aiTutor.subtitle', 'Enter the immersive AI learning environment where all skills are integrated into one seamless conversation experience.'),
      view: 'tutor-room' as const,
      color: 'bg-gradient-to-r from-indigo-500 to-purple-600',
      hoverColor: 'hover:from-indigo-600 hover:to-purple-700',
      isMain: true
    },
    {
      icon: Mic,
      title: translate('speaking.title', 'Voice Mastery Hub'),
      description: translate('speaking.subtitle', 'Master pronunciation and conversation skills with AI-powered feedback.'),
      view: 'speaking' as const,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      clickable: false
    },
    {
      icon: BookOpen,
      title: translate('reading.title', 'Text Explorer Lab'),
      description: translate('reading.subtitle', 'Explore texts and enhance comprehension with intelligent analysis.'),
      view: 'reading' as const,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      clickable: false
    },
  ]

  const handleFeatureClick = (view: 'tutor-room' | 'speaking' | 'reading') => {
    setCurrentView(view)
  }

  const handleBackToHome = () => {
    setCurrentView('home')
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'tutor-room':
        return <AITutorRoom onBack={handleBackToHome} />
      case 'speaking':
        return <SpeakingMode onBack={handleBackToHome} />
      case 'reading':
        return <ReadingMode onBack={handleBackToHome} />
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
               {translate('homePage.title', 'AI Language Learning Companion')}
             </h1>
           </div>
           <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
             {translate('homePage.subtitle', 'Experience the future of language learning with our immersive AI Tutor Room. All learning modes integrated into one seamless, intelligent conversation experience.')}
           </p>
         </div>

        {/* Learning Modes Grid */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold text-gray-800 text-center mb-8">
            {translate('homePage.features.integratedModes', 'Integrated Learning Modes')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {features.slice(1).map((feature, index) => (
              <div
                key={index}
                onClick={feature.clickable !== false ? () => handleFeatureClick(feature.view) : undefined}
                className={`${feature.color} ${feature.clickable !== false ? feature.hoverColor : ''} p-8 rounded-2xl ${feature.clickable !== false ? 'cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl' : 'cursor-default'} group`}
              >
                <div className="flex items-center mb-4">
                  <div className={`w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mr-4 ${feature.clickable !== false ? 'group-hover:scale-110 transition-transform duration-300' : ''}`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold text-white">{feature.title}</h4>
                </div>
                <p className="text-white/90 text-base leading-relaxed">{feature.description}</p>
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
                  <h2 className="text-3xl font-bold text-white mb-2">{translate('aiTutor.title', 'AI Tutor Room')}</h2>
                  <p className="text-white/90 text-lg max-w-2xl">
                    {translate('aiTutor.subtitle', 'Enter the immersive learning environment where speaking and reading are seamlessly integrated into one intelligent conversation experience.')}
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