export default function StatusBadge({ status }) {
  const labels = {
    uploaded: 'Uploaded',
    scored: 'Scored',
    accepted: 'Accepted',
    proposal_ready: 'Proposal Ready',
    approved: 'Approved',
    rejected: 'Rejected',
  }
  return (
    <span className={`badge badge-${status}`}>
      {labels[status] || status}
    </span>
  )
}
