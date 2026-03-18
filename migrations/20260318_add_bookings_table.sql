CREATE TABLE IF NOT EXISTS bookings (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  email varchar(255) NOT NULL,
  phone varchar(32) NOT NULL,
  company varchar(150),
  message text,
  requested_at timestamp NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings (email);
CREATE INDEX IF NOT EXISTS idx_bookings_requested_at ON bookings (requested_at);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings (created_at);
