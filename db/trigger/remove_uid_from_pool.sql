CREATE TRIGGER remove_uid_from_pool
BEFORE INSERT ON participant FOR EACH ROW
BEGIN
  DELETE FROM unique_identifier_pool WHERE uid = new.uid;
END$$