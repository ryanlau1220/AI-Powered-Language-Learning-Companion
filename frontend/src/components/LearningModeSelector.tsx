import React from 'react'
import { BookOpen, PenTool, Mic, Headphones } from 'lucide-react'

interface LearningModeSelectorProps {
  onModeSelect: (mode: string) => void
  currentMode?: string
}

const LearningModeSelector: React.FC<LearningModeSelectorProps> = ({
  onModeSelect,
  currentMode = 'writing'
}) => {
  const learningModes = [
    {
      id: 'writing',
      name: 'Writing',
      description: 'Improve grammar and writing skills',
      icon: PenTool,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    },
    {
      id: 'reading',
      name: 'Reading',
      description: 'AI-generated content with quizzes',
      icon: BookOpen,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600'
    },
    {
      id: 'speaking',
      name: 'Speaking',
      description: 'Voice practice with pronunciation feedback',
      icon: Mic,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600'
    },
    {
      id: 'listening',
      name: 'Listening',
      description: 'Audio content with comprehension questions',
      icon: Headphones,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {learningModes.map((mode) => {
        const IconComponent = mode.icon
        const isSelected = currentMode === mode.id
        
        return (
          <button
            key={mode.id}
            onClick={() => onModeSelect(mode.id)}
            className={`p-6 rounded-lg border-2 transition-all duration-200 ${
              isSelected
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${mode.color} ${mode.hoverColor} text-white`}>
                <IconComponent className="h-6 w-6" />
              </div>
              <div className="text-left">
                <h3 className={`font-semibold text-lg ${
                  isSelected ? 'text-blue-900' : 'text-gray-900'
                }`}>
                  {mode.name}
                </h3>
                <p className={`text-sm ${
                  isSelected ? 'text-blue-700' : 'text-gray-600'
                }`}>
                  {mode.description}
                </p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default LearningModeSelector
