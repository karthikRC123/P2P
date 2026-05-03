"""AI Business Proposal generation service using Groq API."""
import json
from groq import Groq
import httpx
from app.config import settings


def generate_proposal(abstract: str, context: str, impact_score: dict) -> dict:
    """
    Generate a business proposal for an accepted research paper.
    
    Uses the paper content and impact scores as context for proposal generation.
    """
    client = Groq(api_key=settings.GROQ_API_KEY, http_client=httpx.Client(verify=False))

    prompt = f"""You are an expert business strategist and product manager.
Based on the following research paper and its impact assessment, generate a comprehensive business proposal.

PAPER ABSTRACT:
{abstract}

PAPER CONTEXT:
{context[:3000]}

IMPACT ASSESSMENT:
- Novelty: {impact_score.get('novelty', 'N/A')}/100
- Market Relevance: {impact_score.get('market_relevance', 'N/A')}/100
- Feasibility: {impact_score.get('feasibility', 'N/A')}/100
- Scalability: {impact_score.get('scalability', 'N/A')}/100
- Overall Score: {impact_score.get('overall_score', 'N/A')}/100
- Potential: {impact_score.get('potential', 'N/A')}

Generate a business proposal with the following sections. Be specific, actionable, and realistic.

IMPORTANT: Respond ONLY with a valid JSON object in this exact format:
{{
    "product_ideas": [
        {{
            "name": "<product name>",
            "description": "<2-3 sentence description>",
            "unique_value": "<what makes this unique>"
        }}
    ],
    "target_users": "<describe 2-3 target user segments with demographics and pain points>",
    "pricing_estimation": "<suggest pricing model and price points with justification>",
    "market_positioning": "<describe market positioning, competitors, and differentiation strategy>",
    "revenue_model": "<describe revenue streams, monetization strategy, and 3-year revenue projection>"
}}"""

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a business strategist. Always respond with valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model=settings.GROQ_MODEL,
            temperature=0.5,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )

        response_text = chat_completion.choices[0].message.content
        result = json.loads(response_text)

        # Ensure product_ideas is a JSON string for storage
        if isinstance(result.get("product_ideas"), list):
            result["product_ideas"] = json.dumps(result["product_ideas"])

        return {
            "product_ideas": result.get("product_ideas", "[]"),
            "target_users": result.get("target_users", ""),
            "pricing_estimation": result.get("pricing_estimation", ""),
            "market_positioning": result.get("market_positioning", ""),
            "revenue_model": result.get("revenue_model", "")
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Groq API error during proposal generation: {e}")
        return _fallback_proposal()


def _fallback_proposal() -> dict:
    """Generate a fallback proposal template if Groq API fails."""
    return {
        "product_ideas": json.dumps([
            {
                "name": "Proposal Generation Failed",
                "description": "Unable to generate AI proposal. Please retry or fill in manually.",
                "unique_value": "N/A"
            }
        ]),
        "target_users": "Please specify target users manually.",
        "pricing_estimation": "Please specify pricing manually.",
        "market_positioning": "Please specify market positioning manually.",
        "revenue_model": "Please specify revenue model manually."
    }
