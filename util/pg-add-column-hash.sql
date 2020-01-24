BEGIN;
LOCK pieces;

ALTER TABLE pieces ADD COLUMN IF NOT EXISTS hash TEXT;

UPDATE
  pieces
SET
  hash=encode(digest(user_id::text || '.' || language::text || '.' || ast::text, 'sha256'), 'hex');

COMMIT;
