import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Sparkles, ThumbsUp, ThumbsDown, ArrowRight } from 'lucide-react'
import { getPaper, triggerScoring, makeDecision } from '../api/client'
import ScoreGauge from '../components/ScoreGauge'
import StatusBadge from '../components/StatusBadge'
import PipelineSteps from '../components/PipelineSteps'

export default function PaperDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [paper, setPaper] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scoring, setScoring] = useState(false)
  const [deciding, setDeciding] = useState(false)

  useEffect(() => { loadPaper() }, [id])

  const loadPaper = async () => {
    try {
      const { data } = await getPaper(id)
      setPaper(data)
    } catch (err) {
      toast.error('Paper not found.')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleScore = async () => {
    setScoring(true)
    try {
      await triggerScoring(id)
      toast.success('Paper scored successfully!')
      await loadPaper()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Scoring failed.')
    } finally {
      setScoring(false)
    }
  }

  const handleDecision = async (action) => {
    setDeciding(true)
    try {
      const { data } = await makeDecision(id, action)
      toast.success(data.message)
      await loadPaper()
      if (action === 'accept') {
        navigate(`/analyst/${id}`)
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Decision failed.')
    } finally {
      setDeciding(false)
    }
  }

  if (loading) {
    return <div className="loading-container"><div className="spinner" /><p style={{ color: 'var(--text-muted)' }}>Loading paper...</p></div>
  }

  if (!paper) return null

  const score = paper.impact_score
  const getScoreColor = (v) => v >= 70 ? 'var(--accent-emerald)' : v >= 40 ? 'var(--accent-amber)' : 'var(--accent-rose)'

  return (
    <div>
      <div className="page-header animate-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <h1 className="page-title" style={{ fontSize: '1.75rem' }}>{paper.title}</h1>
          <StatusBadge status={paper.status} />
        </div>
        <p className="page-subtitle">{paper.filename}</p>
      </div>

      <PipelineSteps currentStatus={paper.status} />

      <div className="detail-grid animate-in animate-delay-1">
        {/* Left: Paper Info */}
        <div>
          <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Abstract</h3>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
              {paper.abstract || 'No abstract extracted.'}
            </p>
          </div>

          {/* Actions based on status */}
          {paper.status === 'uploaded' && (
            <div className="glass-card" style={{ padding: 28 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>Ready for AI Analysis</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 20 }}>
                Trigger AI impact scoring to evaluate this paper's novelty, market relevance, feasibility, and scalability.
              </p>
              <button className="btn btn-primary btn-lg" onClick={handleScore} disabled={scoring}>
                {scoring ? (
                  <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, marginBottom: 0 }} /> Scoring...</>
                ) : (
                  <><Sparkles size={18} /> Run AI Impact Scoring</>
                )}
              </button>
            </div>
          )}

          {paper.status === 'scored' && (
            <div className="glass-card" style={{ padding: 28 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>Researcher Decision</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 20 }}>
                Review the impact scores and decide whether to proceed with this paper to the business proposal stage.
              </p>
              <div className="action-bar">
                <button className="btn btn-success btn-lg" onClick={() => handleDecision('accept')} disabled={deciding}>
                  <ThumbsUp size={18} /> Accept & Proceed
                </button>
                <button className="btn btn-danger" onClick={() => handleDecision('reject')} disabled={deciding}>
                  <ThumbsDown size={18} /> Reject
                </button>
              </div>
            </div>
          )}

          {paper.status === 'accepted' && (
            <div className="glass-card" style={{ padding: 28 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>Paper Accepted!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 20 }}>
                This paper is ready for business proposal generation.
              </p>
              <button className="btn btn-primary btn-lg" onClick={() => navigate(`/analyst/${id}`)}>
                <ArrowRight size={18} /> Go to Analyst Dashboard
              </button>
            </div>
          )}

          {(paper.status === 'proposal_ready' || paper.status === 'approved') && (
            <div className="glass-card" style={{ padding: 28, borderColor: 'var(--accent-cyan)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8, color: 'var(--accent-cyan)' }}>Business Proposal Stage</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 20 }}>
                The AI impact scoring is complete. View the generated business proposal or the final approval status.
              </p>
              <div className="action-bar">
                <button className="btn btn-primary" onClick={() => navigate(`/analyst/${id}`)}>
                  View Analyst Dashboard
                </button>
                {paper.status === 'approved' && (
                  <button className="btn btn-success" onClick={() => navigate(`/approval/${id}`)}>
                    View Final Approval
                  </button>
                )}
              </div>
            </div>
          )}

          {paper.status === 'rejected' && (
            <div className="glass-card" style={{ padding: 28, borderColor: 'rgba(244,63,94,0.3)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-rose)', marginBottom: 8 }}>Paper Rejected</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                This paper was not selected for further development.
              </p>
            </div>
          )}
        </div>

        {/* Right: Score Panel */}
        <div>
          {score ? (
            <div className="glass-card" style={{ padding: 28 }}>
              <h3 style={{ textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 24 }}>Impact Score</h3>
              <ScoreGauge score={score.overall_score} label={score.potential} />
              <div className="score-grid">
                {[
                  { label: 'Novelty', value: score.novelty, color: 'var(--accent-cyan)' },
                  { label: 'Market Relevance', value: score.market_relevance, color: 'var(--accent-purple)' },
                  { label: 'Feasibility', value: score.feasibility, color: 'var(--accent-emerald)' },
                  { label: 'Scalability', value: score.scalability, color: 'var(--accent-amber)' },
                ].map((item) => (
                  <div key={item.label} className="score-item">
                    <div className="score-item-label">{item.label}</div>
                    <div className="score-item-value" style={{ color: getScoreColor(item.value) }}>
                      {Math.round(item.value)}
                    </div>
                    <div className="score-bar">
                      <div className="score-bar-fill" style={{ width: `${item.value}%`, background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>AI Reasoning</div>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{score.reasoning}</p>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: 28, textAlign: 'center' }}>
              <Sparkles size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Score this paper to see impact analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
