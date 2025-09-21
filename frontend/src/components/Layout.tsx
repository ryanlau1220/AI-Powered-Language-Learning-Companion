import React from 'react'
import { GraduationCap } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import LanguageSwitcher from './LanguageSwitcher'

interface LayoutProps {
  children: React.ReactNode
  onLogoClick?: () => void
}

const Layout: React.FC<LayoutProps> = ({ children, onLogoClick }) => {
  const { translate } = useLanguage()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button 
                onClick={onLogoClick}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <GraduationCap className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">
                  {translate('homePage.title', 'AI Language Learning')}
                </span>
              </button>
            </div>
            
            {/* Language Switcher */}
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

export default Layout
