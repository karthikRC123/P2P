import os
import certifi
os.environ['SSL_CERT_FILE'] = certifi.where()

import asyncio
from app.services.proposal_service import generate_proposal

abstract = "This is a test abstract."
context = "This is a test context."
impact_score = {
    "novelty": 80,
    "market_relevance": 90,
    "feasibility": 85,
    "scalability": 95,
    "overall_score": 88,
    "potential": "High"
}

res = generate_proposal(abstract, context, impact_score)
print(res)
