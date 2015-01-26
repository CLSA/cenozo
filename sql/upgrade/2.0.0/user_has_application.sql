DROP PROCEDURE IF EXISTS patch_user_has_application;
DELIMITER //
CREATE PROCEDURE patch_user_has_application()
  BEGIN

    SELECT "Renaming user_has_service table to user_has_application" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "user_has_application" );
    IF @test = 0 THEN
      -- rename table
      RENAME TABLE user_has_service TO user_has_application;

      -- drop keys
      ALTER TABLE user_has_application
      DROP FOREIGN KEY fk_user_has_service_service_id,
      DROP FOREIGN KEY fk_user_has_service_user_id;

      -- rename columns
      ALTER TABLE user_has_application
      CHANGE service_id application_id INT UNSIGNED NOT NULL;

      -- rename keys
      ALTER TABLE user_has_application
      DROP KEY fk_service_id,
      ADD KEY fk_application_id (application_id);

      ALTER TABLE user_has_application
      ADD CONSTRAINT fk_user_has_application_application_id
      FOREIGN KEY (application_id) REFERENCES application (id)
      ON DELETE NO ACTION ON UPDATE NO ACTION;

      ALTER TABLE user_has_application
      ADD CONSTRAINT fk_user_has_application_user_id
      FOREIGN KEY (user_id) REFERENCES user (id)
      ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;

  END //
DELIMITER ;

CALL patch_user_has_application();
DROP PROCEDURE IF EXISTS patch_user_has_application;
