import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, PartyPopper, ArrowLeft } from 'lucide-react'
import { getPaper, finalApproval } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import PipelineSteps from '../components/PipelineSteps'
import ScoreGauge from '../components/ScoreGauge'

export default function ApprovalPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [paper, setPaper] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deciding, setDeciding] = useState(false)

  useEffect(() => { loadPaper() }, [id])

  const loadPaper = async () => {
    try {
      const { data } = await getPaper(id)
      setPaper(data)
    } catch {
      toast.error('Paper not found.')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleFinalDecision = async (action) => {
    setDeciding(true)
    try {
      const { data } = await finalApproval(id, action)
      toast.success(data.message)
      await loadPaper()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Decision failed.')
    } finally {
      setDeciding(false)
    }
  }

  if (loading) {
    return <div className="loading-container"><div className="spinner" /><p style={{ color: 'var(--text-muted)' }}>Loading...</p></div>
  }
  if (!paper) return null

  const proposal = paper.proposal
  let productIdeas = []
  if (proposal) {
    try { productIdeas = JSON.parse(proposal.product_ideas) } catch { productIdeas = [] }
  }

  return (
    <div>
      {paper.status !== 'approved' && (
        <div className="page-header animate-in">
          <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <h1 className="page-title" style={{ fontSize: '1.75rem' }}>Final Approval</h1>
            <StatusBadge status={paper.status} />
          </div>
          <p className="page-subtitle">{paper.title}</p>
        </div>
      )}

      <PipelineSteps currentStatus={paper.status} />

      {paper.status === 'approved' ? (
        <div className="glass-card animate-in animate-delay-1" style={{ padding: '64px 48px', textAlign: 'center', maxWidth: 640, margin: '48px auto', borderColor: 'var(--border-glass)' }}>
          <div style={{ fontSize: 64, marginBottom: 24, filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.2))' }}>🎉</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-emerald)', marginBottom: 16 }}>
            Pipeline Complete!
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: 40, padding: '0 24px' }}>
            This paper has been approved and is ready for execution. The research-to-product pipeline is complete.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/')} style={{ borderRadius: '100px', padding: '12px 32px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)' }}>
            Back to Dashboard
          </button>
        </div>
      ) : paper.status === 'rejected' ? (
        <div className="glass-card animate-in animate-delay-1" style={{ padding: 48, textAlign: 'center', maxWidth: 640, margin: '0 auto', borderColor: 'rgba(244,63,94,0.3)' }}>
          <XCircle size={56} style={{ color: 'var(--accent-rose)', marginBottom: 16 }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-rose)', marginBottom: 8 }}>Paper Rejected</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>This paper was rejected at final review.</p>
          <button className="btn btn-ghost btn-lg" onClick={() => navigate('/')}>
            Back to Dashboard
          </button>
        </div>
      ) : (
        <div className="detail-grid animate-in animate-delay-1">
          <div>
            {/* Proposal Summary */}
            {proposal && (
              <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>Proposal Summary</h3>

                {productIdeas.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Product Ideas</div>
                    {productIdeas.map((idea, i) => (
                      <div key={i} className="product-idea-card">
                        <div className="product-idea-name">{idea.name}</div>
                        <div className="product-idea-desc">{idea.description}</div>
                      </div>
                    ))}
                  </div>
                )}

                {[
                  { label: 'Target Users', value: proposal.target_users },
                  { label: 'Pricing', value: proposal.pricing_estimation },
                  { label: 'Market Positioning', value: proposal.market_positioning },
                  { label: 'Revenue Model', value: proposal.revenue_model },
                ].map(({ label, value }) => (
                  <div key={label} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{value || 'Not specified.'}</p>
                  </div>
                ))}

                {proposal.analyst_notes && (
                  <div style={{ padding: 16, background: 'rgba(139,92,246,0.08)', borderRadius: 'var(--radius-md)', marginTop: 16 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', marginBottom: 4 }}>Analyst Notes</div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{proposal.analyst_notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Final Decision */}
            {paper.status === 'proposal_ready' && proposal?.analyst_approved && (
              <div className="glass-card" style={{ padding: 28 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>Final Decision</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 20 }}>
                  The analyst has approved this proposal. As the researcher, give your final approval to move to execution.
                </p>
                <div className="action-bar">
                  <button className="btn btn-success btn-lg" onClick={() => handleFinalDecision('accept')} disabled={deciding}>
                    <CheckCircle size={18} /> Approve — Move to Execution
                  </button>
                  <button className="btn btn-danger" onClick={() => handleFinalDecision('reject')} disabled={deciding}>
                    <XCircle size={18} /> Reject — Needs Revision
                  </button>
                </div>
              </div>
            )}

            {paper.status === 'proposal_ready' && !proposal?.analyst_approved && (
              <div className="glass-card" style={{ padding: 28, borderColor: 'rgba(245,158,11,0.3)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: 8 }}>Awaiting Analyst Approval</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  The proposal needs to be approved by the analyst before you can give final approval.
                </p>
                <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => navigate(`/analyst/${id}`)}>
                  Go to Analyst Dashboard
                </button>
              </div>
            )}
          </div>

          {/* Score Sidebar */}
          <div>
            {paper.impact_score && (
              <div className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 20 }}>Impact Score</h3>
                <ScoreGauge score={paper.impact_score.overall_score} label={paper.impact_score.potential} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
