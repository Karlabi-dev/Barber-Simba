-- Uma conta Firebase só pode acessar a agenda do profissional ao qual foi vinculada.
CREATE TABLE professional_accounts (
  professional_id uuid PRIMARY KEY REFERENCES professionals(id) ON DELETE RESTRICT,
  firebase_uid text NOT NULL UNIQUE,
  email text NOT NULL,
  linked_at timestamptz NOT NULL DEFAULT now()
);
