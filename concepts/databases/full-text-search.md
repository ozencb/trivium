---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Full-Text Search

Full-text search lets you query document *content* rather than exact field values — finding "run" in a blog post that only contains "running" is the canonical example of why B-tree indexes fail here. The core problem is that B-trees excel at equality and range lookups on structured data, but language is messy: words inflect, users misspell, and relevance matters more than row order.

### The Core Mechanism

The foundation is an **inverted index**: instead of mapping rows to field values, you map *terms* to the documents that contain them. Building it involves a pipeline:

1. **Tokenization** — split text into tokens ("New York City" → `["new", "york", "city"]`)
2. **Normalization** — lowercase, strip punctuation
3. **Stemming/lemmatization** — reduce words to root forms ("running" → "run")
4. **Stop word removal** — drop high-frequency noise ("the", "is")
5. **Index storage** — for each term, store a posting list: which documents contain it, at what positions, and how often

At query time, your search terms go through the same pipeline, and the engine intersects or unions posting lists. **Relevance ranking** (typically TF-IDF or BM25) scores results: a term appearing 10 times in a short document scores higher than the same term appearing once in a long one.

**Mental model**: imagine a book's index at the back. Every significant word maps to page numbers. Full-text search is that index, built automatically, with scoring logic to say "page 47 is more *about* this word than page 112."

### Practical Scenarios

**Backend**: You're building a support ticket system. Users search "can't login." A LIKE query on `body` does a full table scan and misses tickets that say "unable to authenticate." Postgres `tsvector`/`tsquery` or Elasticsearch handles this natively — index at write time, query in milliseconds against millions of rows.

**Fullstack**: Product search on an e-commerce site. The difference between `LIKE '%jacket%'` and a real FTS index isn't just performance — it's ranking. FTS surfaces "winter jacket" before "jacket zipper pull" when the user clearly wants outerwear.

**Data**: Log analysis pipelines often combine FTS with structured filters. Elasticsearch's query DSL lets you mix full-text search ("error" in `message`) with exact filters (`level = "ERROR"`, `timestamp > now-1h`) in a single query — something that's awkward to express efficiently in SQL.

### When to Reach For It

Reach for FTS when: (1) users are typing natural language queries, (2) you need ranking by relevance, or (3) you're matching against long text fields. Don't reach for it when exact prefix matching suffices — a trigram index (`pg_trgm`) is often enough for autocomplete and is simpler to operate.

Postgres has solid built-in FTS that handles most product needs. Elasticsearch/OpenSearch makes sense when you need distributed scale, complex relevance tuning, or faceted search. Understanding FTS also unlocks **vector databases** — which replace the sparse term-frequency representation with dense semantic embeddings, solving the vocabulary mismatch problem FTS still has.
