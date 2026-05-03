"""PDF processing service — extraction, hashing, and chunking."""
import hashlib
import os
import re
import fitz  # PyMuPDF
from app.config import settings


def compute_file_hash(file_bytes: bytes) -> str:
    """Compute SHA-256 hash of file contents for dedup/caching."""
    return hashlib.sha256(file_bytes).hexdigest()


def save_upload(file_bytes: bytes, filename: str) -> str:
    """Save uploaded file to disk and return the path."""
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_hash = compute_file_hash(file_bytes)
    ext = os.path.splitext(filename)[1] or ".pdf"
    safe_name = f"{file_hash[:16]}_{filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_name)

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    return file_path


def extract_text_from_pdf(file_path: str) -> str:
    """Extract full text from a PDF file using PyMuPDF."""
    doc = fitz.open(file_path)
    full_text = ""

    for page in doc:
        full_text += page.get_text() + "\n"

    doc.close()
    return full_text.strip()


def extract_title(text: str, filename: str) -> str:
    """Attempt to extract the paper title from the text."""
    lines = text.strip().split("\n")
    # Heuristic: title is usually the first non-empty line
    for line in lines[:10]:
        cleaned = line.strip()
        if len(cleaned) > 10 and len(cleaned) < 300:
            return cleaned
    # Fallback to filename
    return os.path.splitext(filename)[0]


def extract_abstract(text: str) -> str:
    """Attempt to extract the abstract from the paper text."""
    # Try to find "Abstract" section
    abstract_pattern = re.compile(
        r"(?:abstract|summary)\s*[:\-—]?\s*(.*?)(?:\n\s*\n|\n(?:1[\.\s]|introduction|keywords|I\.\s))",
        re.IGNORECASE | re.DOTALL
    )
    match = abstract_pattern.search(text)
    if match:
        abstract = match.group(1).strip()
        # Limit length
        if len(abstract) > 50:
            return abstract[:2000]

    # Fallback: return first 1000 chars
    return text[:1000]


def chunk_text(text: str, chunk_size: int = None, overlap: int = None) -> list[str]:
    """Split text into overlapping chunks for vector storage."""
    chunk_size = chunk_size or settings.CHUNK_SIZE
    overlap = overlap or settings.CHUNK_OVERLAP

    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size

        # Try to break at a paragraph or sentence boundary
        if end < len(text):
            # Look for paragraph break
            para_break = text.rfind("\n\n", start, end)
            if para_break > start + chunk_size // 2:
                end = para_break + 2
            else:
                # Look for sentence break
                sent_break = text.rfind(". ", start, end)
                if sent_break > start + chunk_size // 2:
                    end = sent_break + 2

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        start = end - overlap

    return chunks


def process_pdf(file_bytes: bytes, filename: str) -> dict:
    """Full PDF processing pipeline: save, extract, chunk."""
    file_hash = compute_file_hash(file_bytes)
    file_path = save_upload(file_bytes, filename)
    full_text = extract_text_from_pdf(file_path)
    title = extract_title(full_text, filename)
    abstract = extract_abstract(full_text)
    chunks = chunk_text(full_text)

    return {
        "file_hash": file_hash,
        "file_path": file_path,
        "full_text": full_text,
        "title": title,
        "abstract": abstract,
        "chunks": chunks
    }
