CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  nome text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  categoria text NOT NULL,
  preco numeric(10, 2) NOT NULL CHECK (preco >= 0),
  duracao integer NOT NULL CHECK (duracao > 0),
  icon_key text NOT NULL DEFAULT 'tesoura',
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true
);

CREATE TABLE professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  nome text NOT NULL,
  especialidade text NOT NULL DEFAULT '',
  avaliacao numeric(2, 1) CHECK (avaliacao BETWEEN 0 AND 5),
  dias text NOT NULL DEFAULT '',
  image_key text NOT NULL DEFAULT 'perfil',
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true
);

CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid text NOT NULL,
  service_id uuid NOT NULL REFERENCES services(id),
  professional_id uuid NOT NULL REFERENCES professionals(id),
  starts_at timestamptz NOT NULL,
  observacoes text NOT NULL DEFAULT '' CHECK (length(observacoes) <= 500),
  status text NOT NULL DEFAULT 'confirmado'
    CHECK (status IN ('confirmado', 'concluido', 'cancelado')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX bookings_customer_idx ON bookings (firebase_uid, starts_at DESC);
CREATE UNIQUE INDEX bookings_professional_start_idx
  ON bookings (professional_id, starts_at) WHERE status = 'confirmado';
