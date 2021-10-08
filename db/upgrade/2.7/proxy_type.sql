DROP PROCEDURE IF EXISTS patch_proxy_type;
DELIMITER //
CREATE PROCEDURE patch_proxy_type()
  BEGIN

    SELECT COUNT(*) INTO @test
    FROM information_schema.TABLES
    WHERE table_schema = DATABASE()
    AND table_name = "proxy_type";

    IF 0 < @test THEN

      SELECT "Adding new prompt column to proxy_type table" AS "";

      SELECT COUNT(*) INTO @total
      FROM information_schema.COLUMNS
      WHERE table_schema = DATABASE()
      AND table_name = "proxy_type"
      AND column_name = "prompt";

      IF 0 = @total THEN
        ALTER TABLE proxy_type ADD COLUMN prompt TEXT NULL DEFAULT NULL AFTER description;
      END IF;

      SELECT "Renaming proxy type" AS "";

      UPDATE proxy_type SET name = "ready for proxy system" WHERE name = "ready to contact proxy";

    END IF;

  END //
DELIMITER ;

CALL patch_proxy_type();
DROP PROCEDURE IF EXISTS patch_proxy_type;
