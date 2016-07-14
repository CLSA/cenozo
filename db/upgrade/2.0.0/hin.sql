DROP PROCEDURE IF EXISTS patch_hin;
DELIMITER //
CREATE PROCEDURE patch_hin()
  BEGIN

    SELECT "Removing hin column from hin table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "hin"
      AND COLUMN_NAME = "hin" );
    IF @test = 1 THEN
      ALTER TABLE hin DROP COLUMN hin;
    END IF;

    SELECT "Removing future_hin column from hin table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "hin"
      AND COLUMN_NAME = "future_hin" );
    IF @test = 1 THEN
      ALTER TABLE hin DROP COLUMN future_hin;
    END IF;

    SELECT "Making hin.code column mandatory" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "hin"
      AND COLUMN_NAME = "code"
      AND IS_NULLABLE = "YES" );
    IF @test = 1 THEN
      DELETE FROM hin WHERE code IS NULL;
      ALTER TABLE hin MODIFY code VARCHAR(45) NOT NULL;
    END IF;

    SELECT "Adding new datetime column to hin table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "hin"
      AND COLUMN_NAME = "datetime" );
    IF @test = 0 THEN
      ALTER TABLE hin ADD COLUMN datetime DATETIME NOT NULL;
      UPDATE hin SET datetime = CONVERT_TZ( update_timestamp, 'Canada/Eastern', 'UTC' );
      ALTER TABLE hin
      DROP INDEX uq_participant_id,
      ADD UNIQUE INDEX uq_participant_id_datetime (participant_id ASC, datetime ASC);
    END IF;

    SELECT "Modifiying constraint delete rules on participant constraint in hin table" AS "";
 
    SET @test = (
      SELECT DELETE_RULE
      FROM information_schema.REFERENTIAL_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = "hin"
      AND REFERENCED_TABLE_NAME = "participant" );
    IF @test = "NO ACTION" THEN
      ALTER TABLE hin
      DROP FOREIGN KEY fk_hin_participant_id;

      ALTER TABLE hin
      ADD CONSTRAINT fk_hin_participant_id
      FOREIGN KEY (participant_id)
      REFERENCES participant (id)
      ON DELETE CASCADE
      ON UPDATE CASCADE;
    END IF;

    SELECT "Modifiying constraint delete rules on region constraint in hin table" AS "";
 
    SET @test = (
      SELECT DELETE_RULE
      FROM information_schema.REFERENTIAL_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = "hin"
      AND REFERENCED_TABLE_NAME = "region" );
    IF @test = "NO ACTION" THEN
      ALTER TABLE hin
      DROP FOREIGN KEY fk_hin_region_id;

      ALTER TABLE hin
      ADD CONSTRAINT fk_hin_region_id
      FOREIGN KEY (region_id)
      REFERENCES region (id)
      ON DELETE CASCADE
      ON UPDATE CASCADE;
    END IF;

  END //
DELIMITER ;

CALL patch_hin();
DROP PROCEDURE IF EXISTS patch_hin;

SELECT "Adding new triggers to hin table" AS "";

DELIMITER $$

DROP TRIGGER IF EXISTS hin_AFTER_INSERT $$
CREATE DEFINER = CURRENT_USER TRIGGER hin_AFTER_INSERT AFTER INSERT ON hin FOR EACH ROW
BEGIN
  CALL update_participant_last_hin( NEW.participant_id );
END;$$

DROP TRIGGER IF EXISTS hin_AFTER_UPDATE $$
CREATE DEFINER = CURRENT_USER TRIGGER hin_AFTER_UPDATE AFTER UPDATE ON hin FOR EACH ROW
BEGIN
  CALL update_participant_last_hin( NEW.participant_id );
END;$$

DROP TRIGGER IF EXISTS hin_AFTER_DELETE $$
CREATE DEFINER = CURRENT_USER TRIGGER hin_AFTER_DELETE AFTER DELETE ON hin FOR EACH ROW
BEGIN
  CALL update_participant_last_hin( OLD.participant_id );
END;$$

DELIMITER ;
