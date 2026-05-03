import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Wand2, Save, CheckCircle, Users, DollarSign, Target, BarChart3, Lightbulb, Edit3 } from 'lucide-react'
import { getPaper, generateProposal, editProposal, approveProposal } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import PipelineSteps from '../components/PipelineSteps'
import ScoreGauge from '../components/ScoreGauge'

export default function AnalystDashboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [paper, setPaper] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({})

  useEffect(() => { loadPaper() }, [id])

  const loadPaper = async () => {
    try {
      const { data } = await getPaper(id)
      setPaper(data)
      if (data.proposal) {
        setEditData({
          target_users: data.proposal.target_users,
          pricing_estimation: data.proposal.pricing_estimation,
          market_positioning: data.proposal.market_positioning,
          revenue_model: data.proposal.revenue_model,
          analyst_notes: data.proposal.analyst_notes,
        })
      }
    } catch {
      toast.error('Paper not found.')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await generateProposal(id)
      toast.success('Proposal generated!')
      await loadPaper()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Generation failed.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await editProposal(id, editData)
      toast.success('Proposal saved!')
      setEditing(false)
      await loadPaper()
    } catch (err) {
      toast.error('Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async () => {
    try {
      await approveProposal(id)
      toast.success('Proposal approved by analyst!')
      await loadPaper()
      navigate(`/approval/${id}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Approval failed.')
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

  const SECTIONS = [
    { key: 'target_users', label: 'Target Users', icon: <Users size={16} /> },
    { key: 'pricing_estimation', label: 'Pricing Estimation', icon: <DollarSign size={16} /> },
    { key: 'market_positioning', label: 'Market Positioning', icon: <Target size={16} /> },
    { key: 'revenue_model', label: 'Revenue Model', icon: <BarChart3 size={16} /> },
  ]

  return (
    <div>
      <div className="page-header animate-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <h1 className="page-title" style={{ fontSize: '1.75rem' }}>Analyst Dashboard</h1>
          <StatusBadge status={paper.status} />
        </div>
        <p className="page-subtitle">{paper.title}</p>
      </div>

      <PipelineSteps currentStatus={paper.status} />

      {!proposal ? (
        <div className="glass-card animate-in animate-delay-1" style={{ padding: 48, textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
          <Wand2 size={48} style={{ color: 'var(--accent-purple)', marginBottom: 16 }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>Generate Business Proposal</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            AI will analyze the paper and generate product ideas, target users, pricing, and revenue models.
          </p>
          <button className="btn btn-primary btn-lg" onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, marginBottom: 0 }} /> Generating...</>
            ) : (
              <><Wand2 size={18} /> Generate Proposal</>
            )}
          </button>
        </div>
      ) : (
        <div className="animate-in animate-delay-1">
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 24 }}>
            {!editing ? (
              <>
                <button className="btn btn-ghost" onClick={() => setEditing(true)}>
                  <Edit3 size={16} /> Edit
                </button>
                {!proposal.analyst_approved && (
                  <button className="btn btn-success" onClick={handleApprove}>
                    <CheckCircle size={16} /> Approve Proposal
                  </button>
                )}
                {proposal.analyst_approved && (
                  <button className="btn btn-primary" onClick={() => navigate(`/approval/${id}`)}>
                    Go to Final Approval →
                  </button>
                )}
              </>
            ) : (
              <>
                <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>

          <div className="detail-grid">
            <div>
              {/* Product Ideas */}
              <div className="proposal-section">
                <div className="proposal-section-title"><Lightbulb size={16} /> Product Ideas</div>
                {productIdeas.map((idea, i) => (
                  <div key={i} className="product-idea-card">
                    <div className="product-idea-name">{idea.name}</div>
                    <div className="product-idea-desc">{idea.description}</div>
                    {idea.unique_value && (
                      <div className="product-idea-value">💎 {idea.unique_value}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Editable Sections */}
              {SECTIONS.map(({ key, label, icon }) => (
                <div key={key} className="proposal-section">
                  <div className="proposal-section-title">{icon} {label}</div>
                  {editing ? (
                    <textarea
                      className="textarea"
                      value={editData[key] || ''}
                      onChange={e => setEditData({ ...editData, [key]: e.target.value })}
                      rows={4}
                    />
                  ) : (
                    <div className="proposal-content glass-card" style={{ padding: 20 }}>
                      {proposal[key] || 'Not specified.'}
                    </div>
                  )}
                </div>
              ))}

              {/* Analyst Notes */}
              <div className="proposal-section">
                <div className="proposal-section-title"><Edit3 size={16} /> Analyst Notes</div>
                {editing ? (
                  <textarea
                    className="textarea"
                    value={editData.analyst_notes || ''}
                    onChange={e => setEditData({ ...editData, analyst_notes: e.target.value })}
                    placeholder="Add your notes and recommendations..."
                    rows={4}
                  />
                ) : (
                  <div className="proposal-content glass-card" style={{ padding: 20 }}>
                    {proposal.analyst_notes || 'No notes yet.'}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar: Score Summary */}
            <div>
              {paper.impact_score && (
                <div className="glass-card" style={{ padding: 24 }}>
                  <h3 style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 20 }}>Impact Score</h3>
                  <ScoreGauge score={paper.impact_score.overall_score} label={paper.impact_score.potential} />
                </div>
              )}
              {proposal.analyst_approved && (
                <div className="glass-card" style={{ padding: 24, marginTop: 16, borderColor: 'rgba(16,185,129,0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-emerald)' }}>
                    <CheckCircle size={20} />
                    <span style={{ fontWeight: 600 }}>Analyst Approved</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 8 }}>Awaiting final researcher approval.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
