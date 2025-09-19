import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { User, Mail, Globe, Target } from 'lucide-react'

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    nativeLanguage: 'en',
    targetLanguages: ['en'],
    proficiencyLevels: { en: 'beginner' }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement authentication
    console.log('Form submitted:', formData)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required={!isLogin}
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-field pl-10"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {!isLogin && (
              <>
                <div>
                  <label htmlFor="nativeLanguage" className="block text-sm font-medium text-gray-700">
                    Native Language
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="nativeLanguage"
                      name="nativeLanguage"
                      value={formData.nativeLanguage}
                      onChange={handleInputChange}
                      className="input-field pl-10"
                    >
                      {Object.entries(languages).map(([code, name]) => (
                        <option key={code} value={code}>{name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Languages
                  </label>
                  <div className="space-y-2">
                    {Object.entries(languages).map(([code, name]) => (
                      <label key={code} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.targetLanguages.includes(code)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                targetLanguages: [...prev.targetLanguages, code],
                                proficiencyLevels: {
                                  ...prev.proficiencyLevels,
                                  [code]: 'beginner'
                                }
                              }))
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                targetLanguages: prev.targetLanguages.filter(lang => lang !== code),
                                proficiencyLevels: Object.fromEntries(
                                  Object.entries(prev.proficiencyLevels).filter(([lang]) => lang !== code)
                                )
                              }))
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isLogin ? 'Sign in' : 'Create account'}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              ← Back to Home
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
