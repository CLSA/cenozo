DROP PROCEDURE IF EXISTS patch_participant;
DELIMITER //
CREATE PROCEDURE patch_participant()
  BEGIN

    SELECT "Add new email_do_not_contact column to participant table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "participant"
      AND COLUMN_NAME = "email_do_not_contact" );
    IF @test = 0 THEN
      ALTER TABLE participant 
      ADD COLUMN email_do_not_contact TINYINT(1) NOT NULL DEFAULT 0 
      AFTER email_old;
    END IF;

  END //
DELIMITER ;

CALL patch_participant();
DROP PROCEDURE IF EXISTS patch_participant;
