import { Link, useLocation } from 'react-router-dom'
import { Zap, Upload, LayoutDashboard } from 'lucide-react'

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" style={{ color: '#64748b', fontSize: '1.125rem', letterSpacing: '0.05em', fontWeight: 500, textTransform: 'uppercase' }}>
          VISVESVARAYA TECHNOLOGICAL UNIVERSITY
        </Link>
        <div className="navbar-links">
          <Link to="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
            <LayoutDashboard size={16} style={{ marginRight: 6, verticalAlign: -2 }} />
            Dashboard
          </Link>
          <Link to="/upload" className={`nav-link ${pathname === '/upload' ? 'active' : ''}`}>
            <Upload size={16} style={{ marginRight: 6, verticalAlign: -2 }} />
            Upload
          </Link>
        </div>
      </div>
    </nav>
  )
}
