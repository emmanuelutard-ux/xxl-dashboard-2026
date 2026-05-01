-- ─── Meta Ads — Tables de configuration ──────────────────────────────────────

-- Table 1 : comptes publicitaires Meta liés à l'agence
-- Contrairement à Google (1 compte = 1 programme), Meta autorise N programmes par compte
create table if not exists public.meta_ads_accounts (
    id              uuid          primary key default gen_random_uuid(),
    ad_account_id   text          not null unique,    -- ex: "act_1234567890"
    name            text          not null,           -- ex: "XXL Communication"
    business_id     text,                             -- ex: "705303378056195"
    is_active       boolean       not null default true,
    created_at      timestamptz   not null default now()
);

create index if not exists meta_ads_accounts_active_idx
    on public.meta_ads_accounts (is_active);

-- Table 2 : campagnes Meta liées à un programme
-- Une campagne appartient à un compte ET à un programme (relation N-N entre compte et programme)
create table if not exists public.meta_ads_campaigns (
    id              uuid          primary key default gen_random_uuid(),
    campaign_id     text          not null unique,    -- ID Meta de la campagne
    account_id      uuid          not null references public.meta_ads_accounts(id) on delete cascade,
    programme_id    uuid          not null references public.real_estate_programs(id) on delete cascade,
    nom             text          not null,
    objective       text,                             -- ex: "OUTCOME_LEADS", "LEAD_GENERATION"
    is_active       boolean       not null default true,
    created_at      timestamptz   not null default now()
);

create index if not exists meta_ads_campaigns_programme_idx
    on public.meta_ads_campaigns (programme_id);
create index if not exists meta_ads_campaigns_account_idx
    on public.meta_ads_campaigns (account_id);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

alter table public.meta_ads_accounts   enable row level security;
alter table public.meta_ads_campaigns  enable row level security;

-- Lecture/écriture pour utilisateurs authentifiés (rôles agency/expert)
create policy "auth users can read meta_ads_accounts"
    on public.meta_ads_accounts for select
    to authenticated
    using (true);

create policy "auth users can write meta_ads_accounts"
    on public.meta_ads_accounts for all
    to authenticated
    using (true)
    with check (true);

create policy "auth users can read meta_ads_campaigns"
    on public.meta_ads_campaigns for select
    to authenticated
    using (true);

create policy "auth users can write meta_ads_campaigns"
    on public.meta_ads_campaigns for all
    to authenticated
    using (true)
    with check (true);
