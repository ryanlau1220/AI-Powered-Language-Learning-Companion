import React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Utensils, 
  ShoppingBag, 
  MapPin, 
  Hotel, 
  Plane, 
  Building2, 
  GraduationCap,
  Briefcase
} from 'lucide-react'

interface Scenario {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedDuration: number
}

const scenarios: Scenario[] = [
  {
    id: 'restaurant',
    name: 'Restaurant',
    description: 'Order food and ask about the menu',
    icon: Utensils,
    difficulty: 'beginner',
    estimatedDuration: 10
  },
  {
    id: 'shopping',
    name: 'Shopping',
    description: 'Find items and ask about products',
    icon: ShoppingBag,
    difficulty: 'beginner',
    estimatedDuration: 15
  },
  {
    id: 'directions',
    name: 'Directions',
    description: 'Get help navigating the city',
    icon: MapPin,
    difficulty: 'intermediate',
    estimatedDuration: 8
  },
  {
    id: 'hotel',
    name: 'Hotel',
    description: 'Check-in and ask for services',
    icon: Hotel,
    difficulty: 'intermediate',
    estimatedDuration: 12
  },
  {
    id: 'airport',
    name: 'Airport',
    description: 'Navigate through the airport',
    icon: Plane,
    difficulty: 'intermediate',
    estimatedDuration: 20
  },
  {
    id: 'hospital',
    name: 'Hospital',
    description: 'Medical appointments and emergencies',
    icon: Building2,
    difficulty: 'advanced',
    estimatedDuration: 15
  },
  {
    id: 'school',
    name: 'School',
    description: 'Educational conversations',
    icon: GraduationCap,
    difficulty: 'intermediate',
    estimatedDuration: 18
  },
  {
    id: 'work',
    name: 'Work',
    description: 'Professional meetings and discussions',
    icon: Briefcase,
    difficulty: 'advanced',
    estimatedDuration: 25
  }
]

const ScenarioSelector: React.FC = () => {
  const navigate = useNavigate()

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleScenarioSelect = (scenarioId: string) => {
    navigate(`/conversation?scenario=${scenarioId}`)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {scenarios.map((scenario) => {
        const Icon = scenario.icon
        return (
          <div
            key={scenario.id}
            onClick={() => handleScenarioSelect(scenario.id)}
            className="card hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {scenario.name}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(scenario.difficulty)}`}>
                    {scenario.difficulty}
                  </span>
                </div>
                
                <p className="text-sm text-gray-500 mb-3">
                  {scenario.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    ~{scenario.estimatedDuration} min
                  </span>
                  <span className="text-blue-600 text-sm font-medium group-hover:text-blue-700">
                    Start Practice →
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ScenarioSelector
