"""Pydantic schemas for request/response validation."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# ─── Paper Schemas ───────────────────────────────────────────────

class PaperBase(BaseModel):
    title: str = "Untitled Paper"


class PaperCreate(PaperBase):
    pass


class ImpactScoreResponse(BaseModel):
    id: int
    paper_id: int
    novelty: float
    market_relevance: float
    feasibility: float
    scalability: float
    overall_score: float
    potential: str
    reasoning: str
    cached: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ProposalResponse(BaseModel):
    id: int
    paper_id: int
    product_ideas: str
    target_users: str
    pricing_estimation: str
    market_positioning: str
    revenue_model: str
    analyst_notes: str
    analyst_approved: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaperResponse(BaseModel):
    id: int
    title: str
    filename: str
    file_hash: str
    abstract: str
    status: str
    created_at: datetime
    updated_at: datetime
    impact_score: Optional[ImpactScoreResponse] = None
    proposal: Optional[ProposalResponse] = None

    class Config:
        from_attributes = True


class PaperListResponse(BaseModel):
    id: int
    title: str
    filename: str
    status: str
    created_at: datetime
    overall_score: Optional[float] = None
    potential: Optional[str] = None

    class Config:
        from_attributes = True


# ─── Decision Schema ────────────────────────────────────────────

class DecisionRequest(BaseModel):
    action: str = Field(..., pattern="^(accept|reject)$", description="Must be 'accept' or 'reject'")


# ─── Proposal Edit Schema ───────────────────────────────────────

class ProposalEditRequest(BaseModel):
    product_ideas: Optional[str] = None
    target_users: Optional[str] = None
    pricing_estimation: Optional[str] = None
    market_positioning: Optional[str] = None
    revenue_model: Optional[str] = None
    analyst_notes: Optional[str] = None


# ─── Generic Response ───────────────────────────────────────────

class MessageResponse(BaseModel):
    message: str
    status: Optional[str] = None
    paper_id: Optional[int] = None


class UploadResponse(BaseModel):
    message: str
    paper_id: int
    file_hash: str
    cached: bool
    status: str
