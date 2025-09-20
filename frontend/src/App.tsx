import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from 'react-hot-toast'
import { useState } from 'react'

// Pages
import HomePage from './pages/HomePage'

// Components
import Layout from './components/Layout'

// Contexts
import { LanguageProvider } from './contexts/LanguageContext'

// Create a client
const queryClient = new QueryClient()

function App() {
  const [resetKey, setResetKey] = useState(0)

  const handleLogoClick = () => {
    // Reset the HomePage component by changing the key
    setResetKey(prev => prev + 1)
  }

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Layout onLogoClick={handleLogoClick}>
              <Routes>
                <Route path="/" element={<HomePage key={resetKey} />} />
              </Routes>
            </Layout>
            <Toaster position="top-right" />
          </div>
        </Router>
      </LanguageProvider>
    </QueryClientProvider>
  )
}

export default App
