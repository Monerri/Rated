-- Vetted North records. Each record is stored whole as JSON in `data`, with
-- the few fields we look up or tidy by pulled out into columns.

CREATE TABLE IF NOT EXISTS interest_registrations (
  token TEXT PRIMARY KEY,
  service_slug TEXT NOT NULL,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS interest_by_service ON interest_registrations (service_slug);

CREATE TABLE IF NOT EXISTS enquiries (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS saved_progress (
  token TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS service_overrides (
  service_slug TEXT PRIMARY KEY,
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS supplier_applications (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  data TEXT NOT NULL
);
