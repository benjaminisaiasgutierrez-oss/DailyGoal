-- Bloqueo biometrico (WebAuthn): guarda la clave publica de cada credencial
-- (huella/Face ID) registrada por el usuario. La clave privada nunca sale
-- del dispositivo; aqui solo se guarda lo necesario para verificar la firma.
alter table user_settings add column biometric_lock_enabled boolean not null default false;

create table webauthn_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  credential_id text not null unique,
  public_key text not null,
  counter bigint not null default 0,
  transports text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index webauthn_credentials_user_id_idx on webauthn_credentials (user_id);

alter table webauthn_credentials enable row level security;

create policy "webauthn_credentials_select_own" on webauthn_credentials for select using (auth.uid () = user_id);

create policy "webauthn_credentials_insert_own" on webauthn_credentials for insert
with
  check (auth.uid () = user_id);

create policy "webauthn_credentials_update_own" on webauthn_credentials
for update
  using (auth.uid () = user_id);

create policy "webauthn_credentials_delete_own" on webauthn_credentials for delete using (auth.uid () = user_id);
