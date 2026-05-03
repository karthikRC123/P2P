import { CheckCircle } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

const STEPS = [
  { num: 1, label: 'Upload', status: 'uploaded' },
  { num: 2, label: 'AI Scoring', status: 'scored' },
  { num: 3, label: 'Decision', status: 'accepted' },
  { num: 4, label: 'Proposal', status: 'proposal_ready' },
  { num: 5, label: 'Approved', status: 'approved' },
]

const STATUS_ORDER = ['uploaded', 'scored', 'accepted', 'proposal_ready', 'approved']

export default function PipelineSteps({ currentStatus }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const currentIdx = STATUS_ORDER.indexOf(currentStatus)
  const isRejected = currentStatus === 'rejected'

  const handleStepClick = (idx) => {
    if (!id) return;
    if (idx === 0) navigate('/upload')
    else if (idx === 1 || idx === 2) navigate(`/paper/${id}`)
    else if (idx === 3) navigate(`/analyst/${id}`)
    else if (idx === 4) navigate(`/approval/${id}`)
  }

  return (
    <div className="pipeline">
      {STEPS.map((step, i) => {
        const isCompleted = currentIdx > i
        const isActive = currentIdx === i
        let stepClass = 'pipeline-step'
        if (isCompleted) stepClass += ' completed'
        else if (isActive && !isRejected) stepClass += ' active'
        
        const isClickable = !!id && (i <= currentIdx || isCompleted);

        return (
          <div key={step.num} style={{ display: 'flex', alignItems: 'center' }}>
            {i > 0 && (
              <div className={`pipeline-connector ${isCompleted ? 'completed' : ''}`} />
            )}
            <div 
              className={stepClass} 
              onClick={() => isClickable ? handleStepClick(i) : null}
              style={{ cursor: isClickable ? 'pointer' : 'default' }}
            >
              <div className="pipeline-step-number">
                {isCompleted ? <CheckCircle size={14} /> : step.num}
              </div>
              <span className="pipeline-step-label">{step.label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
