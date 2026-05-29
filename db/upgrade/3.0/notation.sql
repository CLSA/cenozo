DROP PROCEDURE IF EXISTS patch_notation;
DELIMITER //
CREATE PROCEDURE patch_notation()
  BEGIN

    SELECT "Making description column in notation table not nullable" AS "";

    SELECT IS_NULLABLE INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "notation"
    AND column_name = "description";

    IF @test = "YES" THEN
      ALTER TABLE notation MODIFY COLUMN description TEXT NOT NULL;
    END IF;

  END //
DELIMITER ;

CALL patch_notation();
DROP PROCEDURE IF EXISTS patch_notation;
