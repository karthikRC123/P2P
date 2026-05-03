"""AI Impact Scoring service using Groq API."""
import json
from groq import Groq
import httpx
from app.config import settings


def score_paper(abstract: str, context: str) -> dict:
    """
    Score a research paper using Groq LLM.
    
    Returns a dict with novelty, market_relevance, feasibility,
    scalability, overall_score, potential, and reasoning.
    """
    client = Groq(api_key=settings.GROQ_API_KEY, http_client=httpx.Client(verify=False))

    prompt = f"""You are an expert research evaluator and product strategist. 
Analyze the following research paper and provide an impact assessment.

PAPER ABSTRACT:
{abstract}

ADDITIONAL CONTEXT FROM PAPER:
{context[:3000]}

Evaluate the paper on these dimensions (score each 0-100):
1. **Novelty**: How original and innovative is this research?
2. **Market Relevance**: How relevant is this to current market needs and trends?
3. **Feasibility**: How practical is it to implement this as a real-world product?
4. **Scalability**: How well can this scale to serve a large market?

Also provide:
- **overall_score**: A weighted average (Novelty 25%, Market Relevance 30%, Feasibility 25%, Scalability 20%)
- **potential**: Based on overall_score: "HIGH" if >= 70, "MEDIUM" if >= 40, "LOW" if < 40
- **reasoning**: A 2-3 sentence explanation of your assessment

IMPORTANT: Respond ONLY with a valid JSON object in this exact format, no additional text:
{{
    "novelty": <number>,
    "market_relevance": <number>,
    "feasibility": <number>,
    "scalability": <number>,
    "overall_score": <number>,
    "potential": "<HIGH|MEDIUM|LOW>",
    "reasoning": "<your explanation>"
}}"""

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a research impact evaluator. Always respond with valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model=settings.GROQ_MODEL,
            temperature=0.3,
            max_tokens=1000,
            response_format={"type": "json_object"}
        )

        response_text = chat_completion.choices[0].message.content
        result = json.loads(response_text)

        # Validate and sanitize scores
        for key in ["novelty", "market_relevance", "feasibility", "scalability", "overall_score"]:
            result[key] = max(0, min(100, float(result.get(key, 0))))

        # Ensure potential is set correctly based on overall_score
        score = result["overall_score"]
        if score >= 70:
            result["potential"] = "HIGH"
        elif score >= 40:
            result["potential"] = "MEDIUM"
        else:
            result["potential"] = "LOW"

        return result

    except json.JSONDecodeError:
        # Fallback: try to extract JSON from response
        return _fallback_scores(abstract)
    except Exception as e:
        print(f"Groq API error: {e}")
        return _fallback_scores(abstract)


def _fallback_scores(abstract: str) -> dict:
    """Generate fallback scores if Groq API fails."""
    # Simple heuristic fallback
    text_len = len(abstract)
    base_score = min(50, text_len // 20)

    return {
        "novelty": base_score + 10,
        "market_relevance": base_score + 5,
        "feasibility": base_score + 15,
        "scalability": base_score,
        "overall_score": base_score + 8,
        "potential": "MEDIUM" if base_score + 8 >= 40 else "LOW",
        "reasoning": "Scores generated using fallback heuristics due to API unavailability. Please retry scoring."
    }
