---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Vector Databases

Traditional databases find exact matches; vector databases find *similar* things. When you encode text, images, or audio into high-dimensional floating-point vectors (embeddings), similarity becomes a geometric problem — two semantically related sentences land near each other in 1,536-dimensional space. Vector DBs exist to answer "what's closest to this point?" efficiently at scale.

**Core mechanism**

Brute-force nearest-neighbor search is O(n·d) per query — unusable at millions of vectors. Vector DBs solve this with approximate nearest-neighbor (ANN) indexes. The dominant approach is **HNSW** (Hierarchical Navigable Small World graphs): a multi-layer graph where each layer is a skip-list-like structure. A query traverses from sparse upper layers down to dense lower ones, greedily moving toward the target vector. You trade a small accuracy loss (missing a few true neighbors) for sub-linear query time. Other approaches — IVF (inverted file index, clusters vectors into Voronoi cells) and PQ (product quantization, compresses vectors by splitting dimensions) — appear in systems like FAISS and are often combined with HNSW.

**Mental model**

Think of a city map. HNSW builds a hierarchy: highways connect distant neighborhoods (top layer), local streets handle fine navigation (bottom layer). When you search, you take highways to the right borough, then walk the streets. You might miss the single closest house if it's on a weird cul-de-sac, but you'll find something very close in milliseconds.

**In practice**

*Backend:* The classic RAG pattern — user query → embed with OpenAI/Cohere → vector DB similarity search → retrieve top-k chunks → LLM generates answer with retrieved context. Pinecone, Weaviate, Qdrant, pgvector (Postgres extension) are common choices. pgvector is underrated for teams already on Postgres with modest scale (< 5M vectors).

*Data:* Recommendation systems use this heavily — embed user behavior or item features, store in a vector DB, retrieve similar items at query time. The hard part is keeping embeddings fresh as the model or data drifts; stale embeddings silently degrade quality without obvious errors.

*Fullstack:* Semantic search UX ("find articles like this one") replaces brittle keyword matching. Users don't need to know the exact terms; queries like "fixing prod issues at 2am" match "incident response under pressure."

**Where engineers get tripped up**

Choosing the right distance metric matters — cosine similarity for normalized embeddings (text), Euclidean for others. Using the wrong one is a silent bug. Also: ANN indexes require tuning (`ef_construction`, `m` in HNSW) — defaults work for demos but not production recall requirements. And hybrid search (combining BM25 keyword scores with vector scores via RRF) usually outperforms pure vector search for most real applications; reaching for pure vector search first is often the wrong default.

The differentiating insight in interviews: vector DBs don't replace relational or document stores — they complement them. Most production systems filter on structured metadata first, then run ANN on the reduced candidate set.
