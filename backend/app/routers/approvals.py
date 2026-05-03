"""Final approval routes (researcher final accept/reject)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Paper
from app.schemas import DecisionRequest, MessageResponse

router = APIRouter(prefix="/api/papers", tags=["approvals"])


@router.post("/{paper_id}/final-approval", response_model=MessageResponse)
def final_approval(paper_id: int, decision: DecisionRequest, db: Session = Depends(get_db)):
    """
    Researcher gives final approval on the analyst-approved proposal.
    
    - Proposal must be analyst-approved
    - Accept → status becomes 'approved' (pipeline complete!)
    - Reject → status becomes 'rejected' (researcher can restart)
    """
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")

    if paper.status != "proposal_ready":
        raise HTTPException(
            status_code=400,
            detail=f"Paper must be in 'proposal_ready' status. Current: '{paper.status}'"
        )

    if not paper.proposal:
        raise HTTPException(status_code=400, detail="No proposal exists for this paper.")

    if not paper.proposal.analyst_approved:
        raise HTTPException(
            status_code=400,
            detail="Proposal must be approved by the analyst before final approval."
        )

    if decision.action == "accept":
        paper.status = "approved"
        message = "🎉 Paper approved! The research-to-product pipeline is complete. Ready for execution!"
    else:
        paper.status = "rejected"
        message = "Paper rejected at final review. The proposal needs revision."

    db.commit()

    return MessageResponse(
        message=message,
        status=paper.status,
        paper_id=paper.id
    )
