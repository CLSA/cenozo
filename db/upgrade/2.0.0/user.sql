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

      UPDATE user
      SET timezone = IFNULL( (
        SELECT timezone
        FROM site
        JOIN access ON site.id = access.site_id
        WHERE access.user_id = user.id
        LIMIT 1
      ), 'Canada/Eastern' );
    END IF;

  END //
DELIMITER ;

CALL patch_user();
DROP PROCEDURE IF EXISTS patch_user;
