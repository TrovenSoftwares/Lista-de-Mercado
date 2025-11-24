
ALTER TABLE markets ADD COLUMN user_id TEXT;
CREATE INDEX idx_markets_user_id ON markets(user_id);
