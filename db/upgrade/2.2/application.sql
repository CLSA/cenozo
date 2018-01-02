DROP PROCEDURE IF EXISTS patch_application;
DELIMITER //
CREATE PROCEDURE patch_application()
  BEGIN

    SELECT "Making application.release_event_type_id column optional" AS "";

    SET @test = ( 
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "application"
      AND COLUMN_NAME = "release_event_type_id"
      AND IS_NULLABLE = "NO" );
    IF @test = 1 THEN
      ALTER TABLE application MODIFY release_event_type_id INT(10) UNSIGNED NULL DEFAULT NULL;
    END IF;

  END //
DELIMITER ;

CALL patch_application();
DROP PROCEDURE IF EXISTS patch_application;
