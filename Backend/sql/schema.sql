-- Database Schema for CLMS - MySQL version

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
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
  verification_token_exp DATETIME NULL DEFAULT NULL,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  lock_until DATETIME NULL DEFAULT NULL,
  block_reason VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_refresh_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reset_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS lab_rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  location VARCHAR(255) DEFAULT '',
  capacity INT NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
         CHECK (status IN ('active','maintenance','decommissioned')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_lab_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS workstations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lab_room_id INT NOT NULL,
  station_code VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45) DEFAULT '',
  mac_address VARCHAR(17) DEFAULT '',
  cpu VARCHAR(100) DEFAULT '',
  ram_gb INT DEFAULT 0,
  gpu VARCHAR(100) DEFAULT '',
  os VARCHAR(100) DEFAULT '',
  state VARCHAR(20) NOT NULL DEFAULT 'available'
        CHECK (state IN ('available','maintenance','reserved')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE (lab_room_id, station_code),
  CONSTRAINT fk_workstation_lab_room FOREIGN KEY (lab_room_id) REFERENCES lab_rooms(id) ON DELETE RESTRICT,
  INDEX idx_workstation_state (state)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  resource_type VARCHAR(20) NOT NULL
                CHECK (resource_type IN ('lab_room','workstation')),
  lab_room_id INT NULL DEFAULT NULL,
  workstation_id INT NULL DEFAULT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  purpose VARCHAR(500) DEFAULT '',
  expected_users INT DEFAULT 1 CHECK (expected_users >= 1),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
         CHECK (status IN ('pending','approved','rejected','cancelled','completed')),
  reject_reason VARCHAR(500),
  processed_by INT NULL DEFAULT NULL,
  processed_at DATETIME NULL DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (start_time < end_time),
  CHECK (
    (resource_type = 'lab_room' AND lab_room_id IS NOT NULL AND workstation_id IS NULL) OR
    (resource_type = 'workstation' AND workstation_id IS NOT NULL AND lab_room_id IS NULL)
  ),
  CONSTRAINT fk_reservation_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reservation_processed_by FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_reservation_lab_room FOREIGN KEY (lab_room_id) REFERENCES lab_rooms(id) ON DELETE SET NULL,
  CONSTRAINT fk_reservation_workstation FOREIGN KEY (workstation_id) REFERENCES workstations(id) ON DELETE SET NULL,
  INDEX idx_reservation_user (user_id),
  INDEX idx_reservation_status (status),
  INDEX idx_reservation_lab (lab_room_id, start_time, end_time),
  INDEX idx_reservation_ws (workstation_id, start_time, end_time)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS incident_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reporter_id INT NOT NULL,
  workstation_id INT NULL DEFAULT NULL,
  lab_room_id INT NULL DEFAULT NULL,
  category VARCHAR(20) NOT NULL
           CHECK (category IN ('hardware','network','os','software')),
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open'
         CHECK (status IN ('open','under_review','resolved','closed')),
  assigned_to INT NULL DEFAULT NULL,
  resolution_note TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL DEFAULT NULL,
  CHECK (workstation_id IS NOT NULL OR lab_room_id IS NOT NULL),
  CONSTRAINT fk_incident_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_incident_assignee FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_incident_lab_room FOREIGN KEY (lab_room_id) REFERENCES lab_rooms(id) ON DELETE SET NULL,
  CONSTRAINT fk_incident_workstation FOREIGN KEY (workstation_id) REFERENCES workstations(id) ON DELETE SET NULL,
  INDEX idx_incident_status (status),
  INDEX idx_incident_reporter (reporter_id)
) ENGINE=InnoDB;
