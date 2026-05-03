import logging
from typing import Dict

try:
    from bert_score import score
except ImportError:
    score = None

logger = logging.getLogger(__name__)

def calculate_bert_score(candidate: str, reference: str) -> Dict[str, float]:
    """
    Calculate BERTScore (Precision, Recall, F1) for a candidate text against a reference.
    """
    if not score:
        raise RuntimeError("bert_score library is not installed.")

    if not candidate or not reference:
        return {"precision": 0.0, "recall": 0.0, "f1": 0.0}

    try:
        # Calculate score. It will automatically download the model (e.g. roberta-large) if missing
        P, R, F1 = score([candidate], [reference], lang="en", verbose=False)
        return {
            "precision": float(P.mean().item()),
            "recall": float(R.mean().item()),
            "f1": float(F1.mean().item())
        }
    except Exception as e:
        logger.error(f"Error calculating BERTScore: {e}")
        raise e
