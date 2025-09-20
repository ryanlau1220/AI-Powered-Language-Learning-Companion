import React, { useState } from 'react'
import LearningModeSelector from '../components/LearningModeSelector'
import WritingMode from '../components/WritingMode'
import ReadingMode from '../components/ReadingMode'
import SpeakingMode from '../components/SpeakingMode'
import ListeningMode from '../components/ListeningMode'

const LearningPage: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<string>('writing')

  const handleModeSelect = (mode: string) => {
    setCurrentMode(mode)
  }

  const handleBackToModes = () => {
    setCurrentMode('writing')
  }

  const renderCurrentMode = () => {
    switch (currentMode) {
      case 'writing':
        return <WritingMode onBack={handleBackToModes} />
      case 'reading':
        return <ReadingMode onBack={handleBackToModes} />
      case 'speaking':
        return <SpeakingMode onBack={handleBackToModes} />
      case 'listening':
        return <ListeningMode onBack={handleBackToModes} />
      default:
        return <WritingMode onBack={handleBackToModes} />
    }
  }

  return (
    <div className="max-w-6xl mx-auto h-screen flex flex-col">
      <div className="card flex-1 flex flex-col">
        {currentMode === 'writing' ? (
          <LearningModeSelector
            onModeSelect={handleModeSelect}
            currentMode={currentMode}
          />
        ) : (
          renderCurrentMode()
        )}
      </div>
    </div>
  )
}

export default LearningPage
