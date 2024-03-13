DROP PROCEDURE IF EXISTS patch_user;
DELIMITER //
CREATE PROCEDURE patch_user()
  BEGIN

    SELECT "Adding new password_type column to user table" AS "";

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "user"
    AND column_name = "password_type";

    IF 0 = @test THEN
      ALTER TABLE user ADD COLUMN password_type ENUM("whirlpool", "bcrypt") NULL DEFAULT NULL AFTER password;
      UPDATE user SET password_type = "whirlpool" WHERE password IS NOT NULL;
    END IF;
  END //
DELIMITER ;

CALL patch_user();
DROP PROCEDURE IF EXISTS patch_user;
