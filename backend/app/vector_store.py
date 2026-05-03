"""ChromaDB vector store wrapper for semantic paper storage."""
import chromadb
from chromadb.utils import embedding_functions
from app.config import settings


class VectorStore:
    """Manages ChromaDB collections for paper embeddings."""

    def __init__(self):
        self.client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
        self.embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=settings.EMBEDDING_MODEL
        )
        self.collection = self.client.get_or_create_collection(
            name="papers",
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"}
        )

    def add_paper_chunks(self, paper_id: int, chunks: list[str], metadatas: list[dict] = None):
        """Add text chunks from a paper to the vector store."""
        ids = [f"paper_{paper_id}_chunk_{i}" for i in range(len(chunks))]

        if metadatas is None:
            metadatas = [{"paper_id": paper_id, "chunk_index": i} for i in range(len(chunks))]

        self.collection.add(
            documents=chunks,
            ids=ids,
            metadatas=metadatas
        )

    def query_paper(self, query: str, paper_id: int = None, n_results: int = 5) -> list[str]:
        """Query the vector store for relevant chunks."""
        where_filter = {"paper_id": paper_id} if paper_id else None

        results = self.collection.query(
            query_texts=[query],
            n_results=n_results,
            where=where_filter
        )

        return results["documents"][0] if results["documents"] else []

    def delete_paper(self, paper_id: int):
        """Remove all chunks for a paper from the vector store."""
        # Get all IDs for this paper
        results = self.collection.get(
            where={"paper_id": paper_id}
        )
        if results["ids"]:
            self.collection.delete(ids=results["ids"])

    def get_paper_context(self, paper_id: int, max_chunks: int = 10) -> str:
        """Get concatenated text context for a paper."""
        results = self.collection.get(
            where={"paper_id": paper_id},
            limit=max_chunks
        )
        if results["documents"]:
            return "\n\n".join(results["documents"])
        return ""


# Singleton instance
vector_store = VectorStore()
