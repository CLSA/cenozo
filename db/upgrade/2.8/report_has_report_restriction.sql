DROP PROCEDURE IF EXISTS patch_report_has_report_restriction;
DELIMITER //
CREATE PROCEDURE patch_report_has_report_restriction()
  BEGIN

    SELECT "Adding missing unique key to report_has_report_restriction table" AS "";

    SELECT COUNT(*) INTO @total
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE table_schema = DATABASE()
    AND table_name = "report_has_report_restriction"
    AND constraint_name = "uq_report_id_report_has_report_restriction_id";

    IF 0 = @total THEN
      ALTER TABLE report_has_report_restriction
      ADD UNIQUE KEY uq_report_id_report_has_report_restriction_id ( report_id, report_restriction_id );
    END IF;

  END //
DELIMITER ;

CALL patch_report_has_report_restriction();
DROP PROCEDURE IF EXISTS patch_report_has_report_restriction;
