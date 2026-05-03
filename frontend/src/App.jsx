import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar.jsx'
import HomePage from './pages/HomePage.jsx'
import UploadPage from './pages/UploadPage.jsx'
import PaperDetailPage from './pages/PaperDetailPage.jsx'
import AnalystDashboard from './pages/AnalystDashboard.jsx'
import ApprovalPage from './pages/ApprovalPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111827',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
          },
        }}
      />
      <Navbar />
      <main className="page">
        <div className="container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/paper/:id" element={<PaperDetailPage />} />
            <Route path="/analyst/:id" element={<AnalystDashboard />} />
            <Route path="/approval/:id" element={<ApprovalPage />} />
          </Routes>
        </div>
      </main>
    </BrowserRouter>
  )
}
