DROP PROCEDURE IF EXISTS patch_user_has_language;
  DELIMITER //
  CREATE PROCEDURE patch_user_has_language()
  BEGIN

    SELECT "Modifiying constraint delete rules in user_has_language table" AS "";

    SET @test = (
      SELECT DELETE_RULE
      FROM information_schema.REFERENTIAL_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = "user_has_language"
      AND REFERENCED_TABLE_NAME = "language" );
    IF @test = "NO ACTION" THEN
      ALTER TABLE user_has_language
      DROP FOREIGN KEY fk_user_has_language_language_id;

      ALTER TABLE user_has_language
      ADD CONSTRAINT fk_user_has_language_language_id
      FOREIGN KEY (language_id)
      REFERENCES language (id)
      ON DELETE CASCADE
      ON UPDATE CASCADE;
    END IF;

    SET @test = (
      SELECT DELETE_RULE
      FROM information_schema.REFERENTIAL_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = "user_has_language"
      AND REFERENCED_TABLE_NAME = "user" );
    IF @test = "NO ACTION" THEN
      ALTER TABLE user_has_language
      DROP FOREIGN KEY fk_user_has_language_user_id;

      ALTER TABLE user_has_language
      ADD CONSTRAINT fk_user_has_language_user_id
      FOREIGN KEY (user_id)
      REFERENCES user (id)
      ON DELETE CASCADE
      ON UPDATE CASCADE;
    END IF;

  END //
DELIMITER ;

-- now call the PROCEDURE and remove the PROCEDURE
CALL patch_user_has_language();
DROP PROCEDURE IF EXISTS patch_user_has_language;
