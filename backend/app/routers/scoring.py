"""AI Impact Scoring routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Paper, ImpactScore
from app.schemas import ImpactScoreResponse, MessageResponse
from app.services.scoring_service import score_paper
from app.vector_store import vector_store

router = APIRouter(prefix="/api/papers", tags=["scoring"])


@router.post("/{paper_id}/score", response_model=ImpactScoreResponse)
def trigger_scoring(paper_id: int, db: Session = Depends(get_db)):
    """
    Trigger AI impact scoring for a paper.
    
    - Checks if score already exists (cache hit)
    - Gets paper context from ChromaDB
    - Calls Groq API for evaluation
    - Updates paper status to 'scored'
    """
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")

    # Check cache: if already scored, return existing
    if paper.impact_score:
        return paper.impact_score

    # Get context from ChromaDB
    context = vector_store.get_paper_context(paper_id)
    if not context:
        context = paper.full_text[:3000] if paper.full_text else paper.abstract

    # Call Groq API for scoring
    scores = score_paper(paper.abstract, context)

    # Save to database
    impact_score = ImpactScore(
        paper_id=paper_id,
        novelty=scores["novelty"],
        market_relevance=scores["market_relevance"],
        feasibility=scores["feasibility"],
        scalability=scores["scalability"],
        overall_score=scores["overall_score"],
        potential=scores["potential"],
        reasoning=scores["reasoning"],
        cached=False
    )
    db.add(impact_score)

    # Update paper status
    paper.status = "scored"
    db.commit()
    db.refresh(impact_score)

    return impact_score


@router.get("/{paper_id}/score", response_model=ImpactScoreResponse)
def get_score(paper_id: int, db: Session = Depends(get_db)):
    """Get the impact score for a paper."""
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")

    if not paper.impact_score:
        raise HTTPException(status_code=404, detail="Paper has not been scored yet. Trigger scoring first.")

    return paper.impact_score
