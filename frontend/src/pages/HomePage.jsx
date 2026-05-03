import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FileText, TrendingUp, CheckCircle, Clock } from 'lucide-react'
import { listPapers } from '../api/client'
import PaperCard from '../components/PaperCard'

export default function HomePage() {
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPapers()
  }, [])

  const loadPapers = async () => {
    try {
      const { data } = await listPapers()
      setPapers(data)
    } catch (err) {
      console.error('Failed to load papers:', err)
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    total: papers.length,
    scored: papers.filter(p => p.overall_score != null).length,
    approved: papers.filter(p => p.status === 'approved').length,
    pending: papers.filter(p => !['approved', 'rejected'].includes(p.status)).length,
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p style={{ color: 'var(--text-muted)' }}>Loading papers...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header animate-in">
        <h1 className="page-title">Research Dashboard</h1>
        <p className="page-subtitle">Transform research papers into validated product opportunities</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }} className="animate-in animate-delay-1">
        {[
          { icon: <FileText size={20} />, label: 'Total Papers', value: stats.total, color: 'var(--accent-blue)' },
          { icon: <TrendingUp size={20} />, label: 'Scored', value: stats.scored, color: 'var(--accent-purple)' },
          { icon: <CheckCircle size={20} />, label: 'Approved', value: stats.approved, color: 'var(--accent-emerald)' },
          { icon: <Clock size={20} />, label: 'In Progress', value: stats.pending, color: 'var(--accent-amber)' },
        ].map((s, i) => (
          <div key={i} className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ color: s.color }}>{s.icon}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} className="animate-in animate-delay-2">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Papers</h2>
        <Link to="/upload" className="btn btn-primary">
          <Plus size={18} /> Upload Paper
        </Link>
      </div>

      {/* Paper Grid */}
      {papers.length === 0 ? (
        <div className="empty-state animate-in animate-delay-3">
          <div className="empty-state-icon">📄</div>
          <div className="empty-state-title">No papers yet</div>
          <p>Upload your first research paper to get started.</p>
          <Link to="/upload" className="btn btn-primary btn-lg" style={{ marginTop: 24 }}>
            <Plus size={18} /> Upload Paper
          </Link>
        </div>
      ) : (
        <div className="papers-grid animate-in animate-delay-3">
          {papers.map(paper => (
            <PaperCard key={paper.id} paper={paper} />
          ))}
        </div>
      )}
    </div>
  )
}
