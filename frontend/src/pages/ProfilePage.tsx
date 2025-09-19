import React, { useState } from 'react'
import { User, Settings, Target, TrendingUp } from 'lucide-react'

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    nativeLanguage: 'en',
    targetLanguages: ['es', 'fr'],
    proficiencyLevels: { es: 'intermediate', fr: 'beginner' }
  })

  const [progress, setProgress] = useState({
    totalConversations: 15,
    totalMessages: 234,
    averagePronunciationScore: 85,
    averageGrammarScore: 78,
    learningStreak: 7
  })

  const languages = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ja: 'Japanese',
    ko: 'Korean',
    zh: 'Chinese'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-500">{user.email}</p>
            <p className="text-sm text-gray-500">
              Native: {languages[user.nativeLanguage as keyof typeof languages]}
            </p>
          </div>
        </div>
      </div>

      {/* Learning Progress */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Learning Progress</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{progress.totalConversations}</div>
            <div className="text-sm text-gray-500">Conversations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{progress.totalMessages}</div>
            <div className="text-sm text-gray-500">Messages</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{progress.averagePronunciationScore}%</div>
            <div className="text-sm text-gray-500">Pronunciation</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{progress.averageGrammarScore}%</div>
            <div className="text-sm text-gray-500">Grammar</div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Learning Streak</span>
            <span className="text-sm text-gray-500">{progress.learningStreak} days</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${Math.min((progress.learningStreak / 30) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Target Languages */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Target className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Target Languages</h2>
        </div>
        
        <div className="space-y-3">
          {user.targetLanguages.map((lang) => (
            <div key={lang} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-lg font-medium">{languages[lang as keyof typeof languages]}</span>
                <span className="text-sm text-gray-500">
                  ({user.proficiencyLevels[lang]})
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      user.proficiencyLevels[lang] === 'beginner' ? 'bg-red-400' :
                      user.proficiencyLevels[lang] === 'intermediate' ? 'bg-yellow-400' :
                      'bg-green-400'
                    }`}
                    style={{ 
                      width: user.proficiencyLevels[lang] === 'beginner' ? '33%' :
                             user.proficiencyLevels[lang] === 'intermediate' ? '66%' : '100%'
                    }}
                  ></div>
                </div>
                <span className="text-sm text-gray-500 capitalize">
                  {user.proficiencyLevels[lang]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Voice
            </label>
            <select className="input-field">
              <option>Joanna (Female, English)</option>
              <option>Matthew (Male, English)</option>
              <option>Lupe (Female, Spanish)</option>
              <option>Mathieu (Male, French)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Speaking Speed
            </label>
            <select className="input-field">
              <option>Slow</option>
              <option>Normal</option>
              <option>Fast</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback Level
            </label>
            <select className="input-field">
              <option>Minimal</option>
              <option>Moderate</option>
              <option>Detailed</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6">
          <button className="btn-primary">Save Settings</button>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
