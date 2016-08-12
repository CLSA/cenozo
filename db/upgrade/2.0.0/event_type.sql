DROP PROCEDURE IF EXISTS patch_event_type;
DELIMITER //
CREATE PROCEDURE patch_event_type()
  BEGIN

    SELECT "Extending event_type name column size" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "event_type"
      AND COLUMN_NAME = "name"
      AND COLUMN_TYPE = "varchar(45)" );
    IF @test = 1 THEN
      ALTER TABLE event_type MODIFY name VARCHAR(100) NOT NULL;
    END IF;

  END //
DELIMITER ;

CALL patch_event_type();
DROP PROCEDURE IF EXISTS patch_event_type;


SELECT "Deleting defunct event types" AS "";
DELETE FROM event_type
WHERE name IN ( "consent to contact signed", "consent signed", "consent for proxy signed" );

SELECT "Adding new triggers to event_type table" AS "";

DELIMITER $$

DROP TRIGGER IF EXISTS event_type_AFTER_INSERT $$
CREATE DEFINER = CURRENT_USER TRIGGER event_type_AFTER_INSERT AFTER INSERT ON event_type FOR EACH ROW
BEGIN
  INSERT INTO participant_last_event( participant_id, event_type_id, event_id )
  SELECT participant.id, NEW.id, NULL 
  FROM participant;
END;$$

DELIMITER ;
