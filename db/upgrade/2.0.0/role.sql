DROP PROCEDURE IF EXISTS patch_role;
DELIMITER //
CREATE PROCEDURE patch_role()
  BEGIN

    SELECT "Adding special column to role table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "role"
      AND COLUMN_NAME = "special" );
    IF @test = 0 THEN
      -- add column
      ALTER TABLE role ADD COLUMN special TINYINT(1) NOT NULL DEFAULT 0;
      UPDATE role SET special = 1 WHERE name IN ( 'cedar', 'onyx', 'opal' );
    END IF;

  END //
DELIMITER ;

CALL patch_role();
DROP PROCEDURE IF EXISTS patch_role;

SELECT "Changing tier of helpline role to 1" AS "";

UPDATE role SET tier = 1 WHERE name = "helpline";
