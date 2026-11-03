create extension if not exists vector with schema extensions;

create table public.personas (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  public_config  jsonb not null,  -- name, colours, language label, greeting text
  private_config jsonb not null,  -- system prompt, stt language, tts params, bias words
  created_at timestamptz default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas(id) on delete cascade,
  title text not null,
  created_at timestamptz default now()
);

create table public.chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade,
  persona_id uuid not null references public.personas(id) on delete cascade,
  content text not null,
  embedding extensions.vector(768) not null,
  created_at timestamptz default now()
);
create index chunks_persona_idx on public.chunks (persona_id);
create index chunks_embedding_idx on public.chunks
  using hnsw (embedding extensions.vector_cosine_ops);

create table public.session_memories (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  persona_slug text not null,
  fact text not null check (char_length(fact) <= 200),
  expires_at timestamptz not null default now() + interval '24 hours',
  created_at timestamptz default now()
);
create index session_memories_lookup_idx on public.session_memories (session_id, persona_slug);

-- RLS: deny everything to public and anon
alter table public.personas         enable row level security;
alter table public.documents        enable row level security;
alter table public.chunks           enable row level security;
alter table public.session_memories enable row level security;

revoke all on all tables    in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

-- match_chunks: only callable by service_role
create or replace function public.match_chunks(
  query_embedding extensions.vector(768),
  p_persona uuid,
  match_count int default 4,
  min_similarity float default 0.55
) returns table (id uuid, document_title text, content text, similarity float)
language sql stable security invoker
set search_path = public, extensions
as $$
  select c.id,
         coalesce(d.title, 'Knowledge base') as document_title,
         c.content,
         1 - (c.embedding <=> query_embedding) as similarity
  from public.chunks c
  left join public.documents d on d.id = c.document_id
  where c.persona_id = p_persona
    and 1 - (c.embedding <=> query_embedding) >= min_similarity
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

revoke execute on function public.match_chunks(extensions.vector, uuid, int, float) from public;
grant  execute on function public.match_chunks(extensions.vector, uuid, int, float) to service_role;
