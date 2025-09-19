import React from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Mic, BookOpen, Target } from 'lucide-react'
import ScenarioSelector from '../components/ScenarioSelector'

const HomePage: React.FC = () => {
  const features = [
    {
      icon: MessageCircle,
      title: 'Real-time Conversations',
      description: 'Practice speaking with an AI tutor that adapts to your responses and provides instant feedback.'
    },
    {
      icon: Mic,
      title: 'Pronunciation Feedback',
      description: 'Get detailed feedback on your pronunciation with confidence scores and improvement tips.'
    },
    {
      icon: BookOpen,
      title: 'Grammar Correction',
      description: 'Receive context-aware grammar suggestions that help you learn naturally.'
    },
    {
      icon: Target,
      title: 'Adaptive Learning',
      description: 'Personalized learning paths that adjust to your proficiency level and interests.'
    }
  ]

  const scenarios = [
    { name: 'Restaurant', description: 'Order food and ask about the menu' },
    { name: 'Shopping', description: 'Find items and ask about products' },
    { name: 'Directions', description: 'Get help navigating the city' },
    { name: 'Hotel', description: 'Check-in and ask for services' },
    { name: 'Airport', description: 'Navigate through the airport' },
    { name: 'Work', description: 'Professional conversations and meetings' }
  ]

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
          Master Languages with
          <span className="text-blue-600"> AI</span>
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Practice real-world conversations with an intelligent AI tutor that provides personalized feedback and adapts to your learning style.
        </p>
        <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
          <div className="rounded-md shadow">
            <Link
              to="/conversation"
              className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
            >
              Start Learning
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose Our Platform?</h2>
            <p className="mt-4 text-lg text-gray-500">
              Advanced AI technology meets personalized learning for the best language learning experience.
            </p>
          </div>
          
          <div className="mt-10">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div key={index} className="card text-center">
                    <div className="flex justify-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                        <Icon className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">{feature.title}</h3>
                    <p className="mt-2 text-sm text-gray-500">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Scenarios Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Practice Real-World Scenarios</h2>
            <p className="mt-4 text-lg text-gray-500">
              Choose from various scenarios to practice conversations you'll actually have.
            </p>
          </div>
          
          <div className="mt-10">
            <ScenarioSelector />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-12 bg-blue-600">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white">Ready to Start Learning?</h2>
          <p className="mt-4 text-lg text-blue-100">
            Join thousands of learners who are already improving their language skills with AI.
          </p>
          <div className="mt-8">
            <Link
              to="/conversation"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
