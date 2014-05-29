DROP PROCEDURE IF EXISTS patch_user_has_language;
DELIMITER //
CREATE PROCEDURE patch_user_has_language()
  BEGIN

    SELECT "Creating new user_has_language table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "user_has_language" );
    IF @test = 0 THEN
      CREATE TABLE IF NOT EXISTS user_has_language ( 
        user_id INT UNSIGNED NOT NULL, 
        language_id INT UNSIGNED NOT NULL, 
        update_timestamp TIMESTAMP NOT NULL, 
        create_timestamp TIMESTAMP NOT NULL, 
        PRIMARY KEY (user_id, language_id), 
        INDEX fk_language_id (language_id ASC), 
        INDEX fk_user_id (user_id ASC), 
        CONSTRAINT fk_user_has_language_user_id 
          FOREIGN KEY (user_id) 
          REFERENCES user (id) 
          ON DELETE NO ACTION 
          ON UPDATE NO ACTION, 
        CONSTRAINT fk_user_has_language_language_id 
          FOREIGN KEY (language_id) 
          REFERENCES language (id) 
          ON DELETE NO ACTION 
          ON UPDATE NO ACTION) 
      ENGINE = InnoDB;

      INSERT INTO user_has_language( user_id, language_id ) 
      SELECT user.id, language.id 
      FROM user 
      JOIN language ON user.language = language.code;
    END IF;

  END //
DELIMITER ;

CALL patch_user_has_language();
DROP PROCEDURE IF EXISTS patch_user_has_language;
