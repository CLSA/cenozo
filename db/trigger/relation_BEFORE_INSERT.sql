CREATE TRIGGER relation_BEFORE_INSERT BEFORE INSERT ON relation FOR EACH ROW
BEGIN
  SELECT primary_participant_id INTO @other_primary_participant_id FROM relation
  WHERE participant_id = NEW.primary_participant_id
  AND primary_participant_id != NEW.primary_participant_id;

  IF @other_primary_participant_id THEN
    SET @sql = CONCAT(
      "Cannot create record with primary_participant_id '",
      NEW.primary_participant_id,
      "' as this record already belongs to another primary participant '",
      @other_primary_participant_id,
      "'"
    );
    SIGNAL SQLSTATE '23000' SET MESSAGE_TEXT = @sql, MYSQL_ERRNO = 1062;
  END IF;
END ;;
