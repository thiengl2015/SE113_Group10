CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE OR REPLACE FUNCTION trg_set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) DEFAULT '',
  phone VARCHAR(20) DEFAULT '',
  role VARCHAR(20) NOT NULL DEFAULT 'customer'
       CHECK (role IN ('customer','lab_staff','system_admin')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
         CHECK (status IN ('active','blocked','pending')),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_token VARCHAR(128),
  verification_token_exp TIMESTAMP,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  lock_until TIMESTAMP,
  block_reason VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_role   ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lab_rooms (
  id SERIAL PRIMARY KEY,
  room_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  location VARCHAR(255) DEFAULT '',
  capacity INT NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
         CHECK (status IN ('active','maintenance','decommissioned')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lab_status ON lab_rooms(status);
DROP TRIGGER IF EXISTS lab_rooms_updated_at ON lab_rooms;
CREATE TRIGGER lab_rooms_updated_at BEFORE UPDATE ON lab_rooms
FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE TABLE IF NOT EXISTS workstations (
  id SERIAL PRIMARY KEY,
  lab_room_id INT NOT NULL REFERENCES lab_rooms(id) ON DELETE RESTRICT,
  station_code VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45) DEFAULT '',
  mac_address VARCHAR(17) DEFAULT '',
  cpu VARCHAR(100) DEFAULT '',
  ram_gb INT DEFAULT 0,
  gpu VARCHAR(100) DEFAULT '',
  os VARCHAR(100) DEFAULT '',
  state VARCHAR(20) NOT NULL DEFAULT 'available'
        CHECK (state IN ('available','maintenance','reserved')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (lab_room_id, station_code)
);
CREATE INDEX IF NOT EXISTS idx_workstation_state ON workstations(state);
DROP TRIGGER IF EXISTS workstations_updated_at ON workstations;
CREATE TRIGGER workstations_updated_at BEFORE UPDATE ON workstations
FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_type VARCHAR(20) NOT NULL
                CHECK (resource_type IN ('lab_room','workstation')),
  lab_room_id INT REFERENCES lab_rooms(id) ON DELETE SET NULL,
  workstation_id INT REFERENCES workstations(id) ON DELETE SET NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  purpose VARCHAR(500) DEFAULT '',
  expected_users INT DEFAULT 1 CHECK (expected_users >= 1),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
         CHECK (status IN ('pending','approved','rejected','cancelled','completed')),
  reject_reason VARCHAR(500),
  processed_by INT REFERENCES users(id) ON DELETE SET NULL,
  processed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CHECK (start_time < end_time),
  CHECK (
    (resource_type = 'lab_room' AND lab_room_id IS NOT NULL AND workstation_id IS NULL) OR
    (resource_type = 'workstation' AND workstation_id IS NOT NULL AND lab_room_id IS NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_reservation_user   ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservation_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservation_lab    ON reservations(lab_room_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_reservation_ws     ON reservations(workstation_id, start_time, end_time);

ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_no_overlap_lab;
ALTER TABLE reservations ADD CONSTRAINT reservations_no_overlap_lab
  EXCLUDE USING gist (
    lab_room_id WITH =,
    tsrange(start_time, end_time, '[)') WITH &&
  )
  WHERE (status = 'approved' AND lab_room_id IS NOT NULL);

ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_no_overlap_ws;
ALTER TABLE reservations ADD CONSTRAINT reservations_no_overlap_ws
  EXCLUDE USING gist (
    workstation_id WITH =,
    tsrange(start_time, end_time, '[)') WITH &&
  )
  WHERE (status = 'approved' AND workstation_id IS NOT NULL);

DROP TRIGGER IF EXISTS reservations_updated_at ON reservations;
CREATE TRIGGER reservations_updated_at BEFORE UPDATE ON reservations
FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE TABLE IF NOT EXISTS incident_tickets (
  id SERIAL PRIMARY KEY,
  reporter_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workstation_id INT REFERENCES workstations(id) ON DELETE SET NULL,
  lab_room_id INT REFERENCES lab_rooms(id) ON DELETE SET NULL,
  category VARCHAR(20) NOT NULL
           CHECK (category IN ('hardware','network','os','software')),
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open'
         CHECK (status IN ('open','under_review','resolved','closed')),
  assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
  resolution_note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP,
  CHECK (workstation_id IS NOT NULL OR lab_room_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_incident_status   ON incident_tickets(status);
CREATE INDEX IF NOT EXISTS idx_incident_reporter ON incident_tickets(reporter_id);
DROP TRIGGER IF EXISTS incident_tickets_updated_at ON incident_tickets;
CREATE TRIGGER incident_tickets_updated_at BEFORE UPDATE ON incident_tickets
FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
