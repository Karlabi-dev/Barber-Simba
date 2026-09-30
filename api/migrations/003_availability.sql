-- Horários locais de Fortaleza. ISO: segunda = 1, domingo = 7.
CREATE TABLE professional_hours (
  professional_id uuid NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  opens_at time NOT NULL,
  closes_at time NOT NULL,
  PRIMARY KEY (professional_id, weekday),
  CHECK (opens_at < closes_at)
);

INSERT INTO professional_hours (professional_id, weekday, opens_at, closes_at)
SELECT p.id, days.weekday, '08:00'::time, '18:00'::time
FROM professionals p CROSS JOIN generate_series(1, 6) AS days(weekday);

-- Preserva a duração original dos agendamentos mesmo se o preço/duração
-- do serviço for alterado depois.
ALTER TABLE bookings ADD COLUMN ends_at timestamptz;
UPDATE bookings b SET ends_at = b.starts_at + s.duracao * interval '1 minute'
FROM services s WHERE s.id = b.service_id;
ALTER TABLE bookings ALTER COLUMN ends_at SET NOT NULL;
ALTER TABLE bookings ADD CONSTRAINT bookings_positive_duration CHECK (ends_at > starts_at);

-- A nova duração padrão do catálogo é 30 minutos para todos os serviços.
-- Agendamentos anteriores continuam com a duração original em ends_at.
UPDATE services SET duracao = 30;

-- O índice anterior só bloqueava dois agendamentos com o mesmo início.
-- Esta restrição também bloqueia sobreposições com inícios diferentes,
-- inclusive quando duas requisições tentam reservar ao mesmo tempo.
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (professional_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&)
  WHERE (status = 'confirmado');
