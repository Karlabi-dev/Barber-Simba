CREATE TABLE customer_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  firebase_uid text NOT NULL,
  type text NOT NULL CHECK (type IN ('created', 'cancelled', 'reminder_day', 'reminder')),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  UNIQUE (booking_id, type)
);

CREATE INDEX customer_notifications_user_idx
  ON customer_notifications (firebase_uid, created_at DESC);

CREATE FUNCTION notify_customer_booking() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO customer_notifications (booking_id, firebase_uid, type, created_at)
      VALUES (NEW.id, NEW.firebase_uid, 'created', NEW.created_at);
  ELSIF NEW.status = 'cancelado' AND OLD.status IS DISTINCT FROM 'cancelado' THEN
    INSERT INTO customer_notifications (booking_id, firebase_uid, type)
      VALUES (NEW.id, NEW.firebase_uid, 'cancelled');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER customer_booking_notification
  AFTER INSERT OR UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION notify_customer_booking();
