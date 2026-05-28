-- Photo embeddings for the "scan to recognize" feature.
--
-- Applies to the existing item_photos table from the Expo app. Idempotent:
-- safe to re-run.
--
-- After running this, your server needs to back-fill embeddings for any
-- existing photos. The web app does this on photo upload via the
-- item-photo embedding worker (see lib/embeddings.ts).

create extension if not exists vector;

-- Default dimension is 1024 (Voyage Multimodal-3, Cohere Embed v4). If you
-- switch to a 1536- or 3072-dim model, drop and re-create the column.
alter table item_photos
  add column if not exists embedding vector(1024);

-- HNSW index for fast cosine-distance search at write-heavy scale.
-- Use ivfflat instead if you're on Postgres without HNSW support.
create index if not exists item_photos_embedding_hnsw
  on item_photos using hnsw (embedding vector_cosine_ops);

-- RPC consumed by the web app's scan action. Returns top N matches that
-- pass a minimum-similarity threshold. Similarity = 1 - cosine_distance,
-- so 1.0 is identical and 0.0 is orthogonal.
create or replace function match_item_photos(
  query_embedding vector(1024),
  match_count int default 5,
  similarity_threshold float default 0.55
)
returns table (
  item_id uuid,
  photo_id uuid,
  name text,
  category text,
  similarity float,
  storage_path text
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    items.id           as item_id,
    item_photos.id     as photo_id,
    items.name,
    items.category,
    1 - (item_photos.embedding <=> query_embedding) as similarity,
    item_photos.storage_path
  from item_photos
  join items on items.id = item_photos.item_id
  where item_photos.embedding is not null
    and 1 - (item_photos.embedding <=> query_embedding) >= similarity_threshold
  order by item_photos.embedding <=> query_embedding asc
  limit match_count;
$$;

comment on function match_item_photos is
  'Vector similarity search used by the Heirloom web scan/recognize flow.';
