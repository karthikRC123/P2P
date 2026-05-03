"""Business proposal routes (generation, editing, analyst approval)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Paper, Proposal
from app.schemas import ProposalResponse, ProposalEditRequest, MessageResponse
from app.services.proposal_service import generate_proposal
from app.services.evaluation_service import calculate_bert_score
from app.vector_store import vector_store

router = APIRouter(prefix="/api/papers", tags=["proposals"])


@router.post("/{paper_id}/proposal/generate", response_model=ProposalResponse)
def generate_paper_proposal(paper_id: int, db: Session = Depends(get_db)):
    """
    Generate a business proposal for an accepted paper using AI.
    
    - Paper must be in 'accepted' status
    - Uses Groq API to generate structured proposal
    - Updates paper status to 'proposal_ready'
    """
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")

    if paper.status not in ("accepted", "proposal_ready"):
        raise HTTPException(
            status_code=400,
            detail=f"Paper must be in 'accepted' status. Current: '{paper.status}'"
        )

    # If proposal already exists, return it
    if paper.proposal:
        return paper.proposal

    # Get context from ChromaDB
    context = vector_store.get_paper_context(paper_id)
    if not context:
        context = paper.full_text[:3000] if paper.full_text else paper.abstract

    # Build impact score dict for context
    impact_dict = {}
    if paper.impact_score:
        impact_dict = {
            "novelty": paper.impact_score.novelty,
            "market_relevance": paper.impact_score.market_relevance,
            "feasibility": paper.impact_score.feasibility,
            "scalability": paper.impact_score.scalability,
            "overall_score": paper.impact_score.overall_score,
            "potential": paper.impact_score.potential
        }

    # Generate proposal via Groq
    proposal_data = generate_proposal(paper.abstract, context, impact_dict)

    # Save to database
    proposal = Proposal(
        paper_id=paper_id,
        product_ideas=proposal_data["product_ideas"],
        target_users=proposal_data["target_users"],
        pricing_estimation=proposal_data["pricing_estimation"],
        market_positioning=proposal_data["market_positioning"],
        revenue_model=proposal_data["revenue_model"]
    )
    db.add(proposal)

    paper.status = "proposal_ready"
    db.commit()
    db.refresh(proposal)

    return proposal


@router.get("/{paper_id}/proposal", response_model=ProposalResponse)
def get_proposal(paper_id: int, db: Session = Depends(get_db)):
    """Get the business proposal for a paper."""
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")

    if not paper.proposal:
        raise HTTPException(status_code=404, detail="No proposal generated yet.")

    return paper.proposal


@router.put("/{paper_id}/proposal", response_model=ProposalResponse)
def edit_proposal(paper_id: int, edits: ProposalEditRequest, db: Session = Depends(get_db)):
    """
    Business Analyst edits the proposal.
    
    Allows partial updates — only provided fields are updated.
    """
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")

    if not paper.proposal:
        raise HTTPException(status_code=404, detail="No proposal to edit.")

    # Apply partial updates
    update_data = edits.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(paper.proposal, key, value)

    db.commit()
    db.refresh(paper.proposal)
    return paper.proposal


@router.post("/{paper_id}/proposal/approve", response_model=MessageResponse)
def analyst_approve(paper_id: int, db: Session = Depends(get_db)):
    """Business Analyst approves the proposal."""
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")

    if not paper.proposal:
        raise HTTPException(status_code=404, detail="No proposal to approve.")

    paper.proposal.analyst_approved = True
    db.commit()

    return MessageResponse(
        message="Proposal approved by analyst! Awaiting final researcher approval.",
        status="proposal_ready",
        paper_id=paper.id
    )


@router.get("/{paper_id}/proposal/bertscore")
def get_proposal_bertscore(paper_id: int, db: Session = Depends(get_db)):
    """
    Evaluate the generated business proposal against the paper's abstract using BERTScore.
    This helps measure the faithfulness of the generated product ideas to the original research.
    """
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")

    if not paper.proposal:
        raise HTTPException(status_code=404, detail="No proposal generated yet.")

    reference = paper.abstract
    
    # Construct a candidate string from the proposal's main points
    candidate = f"Product Ideas: {paper.proposal.product_ideas}\nTarget Users: {paper.proposal.target_users}\nMarket Positioning: {paper.proposal.market_positioning}"
    
    try:
        metrics = calculate_bert_score(candidate, reference)
        return metrics
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate BERTScore: {str(e)}")

