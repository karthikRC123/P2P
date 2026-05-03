"""SQLAlchemy ORM models for Paper2Impact AI."""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from app.database import Base


class Paper(Base):
    """A research paper uploaded by a researcher."""
    __tablename__ = "papers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(500), nullable=False, default="Untitled Paper")
    filename = Column(String(255), nullable=False)
    file_hash = Column(String(64), unique=True, nullable=False, index=True)
    file_path = Column(String(500), nullable=False)
    abstract = Column(Text, default="")
    full_text = Column(Text, default="")
    status = Column(
        String(50),
        default="uploaded",
        nullable=False,
        index=True
    )
    # Status flow:
    #   uploaded → scored → accepted → proposal_ready → approved
    #   At any step it can also become: rejected

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    impact_score = relationship(
        "ImpactScore", back_populates="paper", uselist=False, cascade="all, delete-orphan"
    )
    proposal = relationship(
        "Proposal", back_populates="paper", uselist=False, cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Paper(id={self.id}, title='{self.title}', status='{self.status}')>"


class ImpactScore(Base):
    """AI-generated impact score for a research paper."""
    __tablename__ = "impact_scores"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    paper_id = Column(Integer, ForeignKey("papers.id", ondelete="CASCADE"), unique=True, nullable=False)

    novelty = Column(Float, default=0.0)
    market_relevance = Column(Float, default=0.0)
    feasibility = Column(Float, default=0.0)
    scalability = Column(Float, default=0.0)
    overall_score = Column(Float, default=0.0)
    potential = Column(String(10), default="LOW")  # HIGH / MEDIUM / LOW
    reasoning = Column(Text, default="")
    cached = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    paper = relationship("Paper", back_populates="impact_score")

    def __repr__(self):
        return f"<ImpactScore(paper_id={self.paper_id}, overall={self.overall_score}, potential='{self.potential}')>"


class Proposal(Base):
    """Business proposal generated for an accepted paper."""
    __tablename__ = "proposals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    paper_id = Column(Integer, ForeignKey("papers.id", ondelete="CASCADE"), unique=True, nullable=False)

    product_ideas = Column(Text, default="[]")  # JSON string
    target_users = Column(Text, default="")
    pricing_estimation = Column(Text, default="")
    market_positioning = Column(Text, default="")
    revenue_model = Column(Text, default="")
    analyst_notes = Column(Text, default="")
    analyst_approved = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    paper = relationship("Paper", back_populates="proposal")

    def __repr__(self):
        return f"<Proposal(paper_id={self.paper_id}, approved={self.analyst_approved})>"
