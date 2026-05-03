"""Paper upload and listing routes."""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Paper
from app.schemas import PaperResponse, PaperListResponse, UploadResponse
from app.services.pdf_service import process_pdf, compute_file_hash
from app.vector_store import vector_store

router = APIRouter(prefix="/api/papers", tags=["papers"])


@router.post("/upload", response_model=UploadResponse)
async def upload_paper(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload a research paper PDF.
    
    - Computes SHA-256 hash for deduplication
    - If hash exists, returns cached paper instantly
    - Otherwise: extracts text, chunks it, stores in ChromaDB
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    file_bytes = await file.read()

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    # Check hash for cache hit
    file_hash = compute_file_hash(file_bytes)
    existing = db.query(Paper).filter(Paper.file_hash == file_hash).first()

    if existing:
        return UploadResponse(
            message="Paper already uploaded (cached).",
            paper_id=existing.id,
            file_hash=file_hash,
            cached=True,
            status=existing.status
        )

    # Process the PDF
    result = process_pdf(file_bytes, file.filename)

    # Create database record
    paper = Paper(
        title=result["title"],
        filename=file.filename,
        file_hash=result["file_hash"],
        file_path=result["file_path"],
        abstract=result["abstract"],
        full_text=result["full_text"],
        status="uploaded"
    )
    db.add(paper)
    db.commit()
    db.refresh(paper)

    # Store chunks in ChromaDB
    if result["chunks"]:
        metadatas = [
            {"paper_id": paper.id, "chunk_index": i, "filename": file.filename}
            for i in range(len(result["chunks"]))
        ]
        vector_store.add_paper_chunks(paper.id, result["chunks"], metadatas)

    return UploadResponse(
        message="Paper uploaded and processed successfully.",
        paper_id=paper.id,
        file_hash=result["file_hash"],
        cached=False,
        status="uploaded"
    )


@router.get("", response_model=list[PaperListResponse])
def list_papers(db: Session = Depends(get_db)):
    """List all uploaded papers with their status and scores."""
    papers = db.query(Paper).order_by(Paper.created_at.desc()).all()
    result = []

    for p in papers:
        item = PaperListResponse(
            id=p.id,
            title=p.title,
            filename=p.filename,
            status=p.status,
            created_at=p.created_at,
            overall_score=p.impact_score.overall_score if p.impact_score else None,
            potential=p.impact_score.potential if p.impact_score else None
        )
        result.append(item)

    return result


@router.get("/{paper_id}", response_model=PaperResponse)
def get_paper(paper_id: int, db: Session = Depends(get_db)):
    """Get detailed information about a specific paper."""
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")
    return paper


@router.delete("/{paper_id}", response_model=dict)
def delete_paper(paper_id: int, db: Session = Depends(get_db)):
    """Delete a paper and its associated data."""
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")

    # Remove from ChromaDB
    try:
        vector_store.delete_paper(paper_id)
    except Exception:
        pass  # ChromaDB cleanup is best-effort

    db.delete(paper)
    db.commit()
    return {"message": "Paper deleted successfully."}
