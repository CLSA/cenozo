CREATE TRIGGER search_AFTER_INSERT
AFTER INSERT ON search FOR EACH ROW
BEGIN
  REPLACE INTO search_result( create_timestamp, search_id, participant_id, record_id, subject, column_name, value )