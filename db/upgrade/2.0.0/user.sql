DROP PROCEDURE IF EXISTS patch_user;
DELIMITER //
CREATE PROCEDURE patch_user()
  BEGIN

    SELECT "Adding email column to user table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "user"
      AND COLUMN_NAME = "email" );
    IF @test = 0 THEN
      -- add column
      ALTER TABLE user
      ADD COLUMN email VARCHAR(255) NULL,
      ADD UNIQUE INDEX uq_email (email ASC);
    END IF;

    SELECT "Adding timezone column to user table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "user"
      AND COLUMN_NAME = "timezone" );
    IF @test = 0 THEN
      -- add column
      ALTER TABLE user
      ADD COLUMN timezone VARCHAR(45) NOT NULL DEFAULT 'Canada/Eastern';
    END IF;

    SELECT "Adding use_12hour_clock column to user table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "user"
      AND COLUMN_NAME = "use_12hour_clock" );
    IF @test = 0 THEN
      -- add column
      ALTER TABLE user
      ADD COLUMN use_12hour_clock TINYINT(1) NOT NULL DEFAULT 0;

      UPDATE user
      LEFT JOIN user_has_language
      ON user.id = user_has_language.user_id
      AND user_has_language.language_id = ( SELECT ID FROM language WHERE code = "fr" )
      SET use_12hour_clock = true
      WHERE user_has_language.language_id IS NULL;
    END IF;

  END //
DELIMITER ;

CALL patch_user();
DROP PROCEDURE IF EXISTS patch_user;
