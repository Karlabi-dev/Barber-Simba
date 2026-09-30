-- Guarda o nome informado no Firebase no momento da reserva.
-- Reservas anteriores permanecem sem nome até serem identificadas por outro meio.
ALTER TABLE bookings ADD COLUMN customer_name text NOT NULL DEFAULT ''
  CHECK (length(customer_name) <= 120);

ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('confirmado', 'em_atendimento', 'concluido', 'cancelado'));

-- Durante o atendimento o horário continua ocupado para novas reservas.
ALTER TABLE bookings DROP CONSTRAINT bookings_no_overlap;
ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (professional_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&)
  WHERE (status IN ('confirmado', 'em_atendimento'));

CREATE INDEX bookings_calendar_idx ON bookings (starts_at);
