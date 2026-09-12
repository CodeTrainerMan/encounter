-- ============================================================
-- Encounter 数据库结构（PostgreSQL / Vercel Postgres / Neon）
-- 执行方式：npm run db:init
-- ============================================================

create table if not exists encounters (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  type        text not null default 'moment',
  happened_at date not null default current_date,
  location    text,
  summary     text,
  content     text,
  tags        text[] not null default '{}',
  cover_image text,
  rating      integer check (rating is null or (rating >= 1 and rating <= 5)),
  favorite    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists encounters_happened_at_idx on encounters (happened_at desc);
create index if not exists encounters_type_idx        on encounters (type);
create index if not exists encounters_favorite_idx    on encounters (favorite) where favorite;
create index if not exists encounters_tags_idx        on encounters using gin (tags);

-- ============================================================
-- 作者：一个作者 = 一个 Discord 账号
-- ------------------------------------------------------------
-- 只存展示所需的最小信息（昵称与头像），不存邮箱等隐私字段。
-- discord_id 是唯一标识，登录时按它 upsert。
-- ============================================================
create table if not exists authors (
  id           uuid primary key default gen_random_uuid(),
  discord_id   text not null unique,
  username     text not null,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- 记录归属
-- ------------------------------------------------------------
-- 允许为空：接入登录之前写入的历史记录没有作者，它们只读。
-- 作者注销时置空而不是级联删除——记录本身是这家人的回忆，
-- 不应该因为账号问题消失。
-- ============================================================
alter table encounters add column if not exists author_id uuid
  references authors (id) on delete set null;

create index if not exists encounters_author_idx on encounters (author_id);

-- ============================================================
-- 表情反应：给某条记录贴一个 emoji
-- ------------------------------------------------------------
-- 同一个人对同一条记录同一个 emoji 只能算一次，
-- 因此用唯一索引兜底而不是靠应用层判断。
-- 记录被删除时反应一并清除。
-- ============================================================
create table if not exists encounter_reactions (
  id           uuid primary key default gen_random_uuid(),
  encounter_id uuid not null references encounters (id) on delete cascade,
  author_id    uuid not null references authors (id) on delete cascade,
  emoji        text not null,
  created_at   timestamptz not null default now()
);

create unique index if not exists encounter_reactions_unique_idx
  on encounter_reactions (encounter_id, author_id, emoji);

create index if not exists encounter_reactions_encounter_idx
  on encounter_reactions (encounter_id);

-- ============================================================
-- 留言：在某条记录下面说的话
-- ------------------------------------------------------------
-- 和表情反应分开建表：留言有正文，而且可以有来有回。
-- 记录被删除时留言一并清除。
-- 作者注销时留言也一并删除——有别于记录本身：记录是大家共同的回忆，
-- 一条没有作者的留言却不再成立。
-- ============================================================
create table if not exists encounter_comments (
  id           uuid primary key default gen_random_uuid(),
  encounter_id uuid not null references encounters (id) on delete cascade,
  author_id    uuid not null references authors (id) on delete cascade,
  content      text not null,
  created_at   timestamptz not null default now()
);

create index if not exists encounter_comments_encounter_idx
  on encounter_comments (encounter_id, created_at);

create index if not exists encounter_comments_author_idx
  on encounter_comments (author_id);

