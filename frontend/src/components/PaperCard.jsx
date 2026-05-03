import { useNavigate } from 'react-router-dom'
import { FileText, TrendingUp } from 'lucide-react'
import StatusBadge from './StatusBadge'

export default function PaperCard({ paper }) {
  const navigate = useNavigate()
  const date = new Date(paper.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  const handleClick = () => {
    if (paper.status === 'proposal_ready' || paper.status === 'approved') {
      navigate(`/analyst/${paper.id}`)
    } else {
      navigate(`/paper/${paper.id}`)
    }
  }

  return (
    <div className="glass-card paper-card" onClick={handleClick}>
      <div className="paper-card-header">
        <h3 className="paper-card-title">{paper.title}</h3>
        <StatusBadge status={paper.status} />
      </div>
      <div className="paper-card-meta">
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <FileText size={14} /> {paper.filename}
        </span>
        <span>{date}</span>
        {paper.overall_score != null && (
          <span className="paper-card-score" style={{
            color: paper.overall_score >= 70 ? 'var(--accent-emerald)' :
                   paper.overall_score >= 40 ? 'var(--accent-amber)' : 'var(--accent-rose)'
          }}>
            <TrendingUp size={14} /> {Math.round(paper.overall_score)}
          </span>
        )}
        {paper.potential && (
          <span className={`badge badge-${paper.potential.toLowerCase()}`}>
            {paper.potential}
          </span>
        )}
      </div>
    </div>
  )
}
