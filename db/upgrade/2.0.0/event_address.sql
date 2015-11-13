DROP PROCEDURE IF EXISTS patch_event_address;
DELIMITER //
CREATE PROCEDURE patch_event_address()
  BEGIN

    SELECT "Adding international column to event_address table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "event_address"
      AND COLUMN_NAME = "international" );
    IF @test = 0 THEN
      ALTER TABLE event_address
      ADD COLUMN international TINYINT(1) NOT NULL DEFAULT 0 AFTER address_id,
      MODIFY region_id INT UNSIGNED NULL,
      MODIFY postcode VARCHAR(10) NULL;
    END IF;

  END //
DELIMITER ;

CALL patch_event_address();
DROP PROCEDURE IF EXISTS patch_event_address;
