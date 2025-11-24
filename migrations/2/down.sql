
DROP INDEX idx_user_profiles_user_id;
DROP TABLE user_profiles;
DROP INDEX idx_list_shares_user_id;
DROP INDEX idx_list_shares_list_id;
DROP TABLE list_shares;
DROP INDEX idx_lists_user_id;
ALTER TABLE lists DROP COLUMN user_id;
