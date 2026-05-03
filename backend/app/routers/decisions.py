"""Researcher decision routes (accept/reject after scoring)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Paper
from app.schemas import DecisionRequest, MessageResponse

router = APIRouter(prefix="/api/papers", tags=["decisions"])


@router.post("/{paper_id}/decision", response_model=MessageResponse)
def make_decision(paper_id: int, decision: DecisionRequest, db: Session = Depends(get_db)):
    """
    Researcher accepts or rejects a scored paper.
    
    - Paper must be in 'scored' status
    - Accept → status becomes 'accepted'
    - Reject → status becomes 'rejected'
    """
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")

    if paper.status != "scored":
        raise HTTPException(
            status_code=400,
            detail=f"Paper must be in 'scored' status to make a decision. Current status: '{paper.status}'"
        )

    if decision.action == "accept":
        paper.status = "accepted"
        message = "Paper accepted! It will now proceed to the Business Analyst for proposal generation."
    else:
        paper.status = "rejected"
        message = "Paper rejected by researcher."

    db.commit()

    return MessageResponse(
        message=message,
        status=paper.status,
        paper_id=paper.id
    )
