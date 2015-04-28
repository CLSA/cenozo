DROP PROCEDURE IF EXISTS patch_participant;
DELIMITER //
CREATE PROCEDURE patch_participant()
  BEGIN

    SELECT "Changing email_do_not_contact to mass_email in participant table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "participant"
      AND COLUMN_NAME = "email_do_not_contact" );
    IF @test = 1 THEN
      -- add column
      ALTER TABLE participant
      ADD COLUMN mass_email TINYINT(1) NOT NULL DEFAULT 1
      AFTER email_do_not_contact;

      UPDATE participant SET mass_email = IF( email_do_not_contact, 0, 1 );

      ALTER TABLE participant DROP COLUMN email_do_not_contact;
    END IF;

  END //
DELIMITER ;

CALL patch_participant();
DROP PROCEDURE IF EXISTS patch_participant;
