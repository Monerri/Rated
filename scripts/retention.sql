-- Deletes records past the retention periods in the privacy notice.
-- Run on every deploy, including the daily scheduled one.
-- Timestamps are stored as ISO 8601 strings (2026-10-09T12:00:00.000Z).

-- Saved answers: up to 12 months.
DELETE FROM saved_progress WHERE created_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-12 months');

-- Enquiries: 24 months.
DELETE FROM enquiries WHERE created_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-24 months');

-- Interest registrations: no longer than 24 months.
DELETE FROM interest_registrations WHERE created_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-24 months');

-- Supplier applications are kept for 24 months if unsuccessful, or longer for
-- businesses that join, so they are reviewed by hand rather than deleted here.
