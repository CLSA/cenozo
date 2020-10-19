DROP PROCEDURE IF EXISTS patch_report_restriction;
DELIMITER //
CREATE PROCEDURE patch_report_restriction()
  BEGIN

    SELECT "Changing ENUM values in restriction_type column in the report_restriction table" AS "";

    SELECT COUNT(*) INTO @test
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = "report_restriction"
    AND column_name = "restriction_type"
    AND column_type LIKE "%'uid_list'%";

    IF 1 = @test THEN
      ALTER TABLE report_restriction 
      MODIFY restriction_type ENUM(
        'table','identifier_list','uid_list','string','integer','decimal','date','datetime','time','boolean','enum'
      ) NOT NULL;

      UPDATE report_restriction
      SET restriction_type = "identifier_list"
      WHERE restriction_type = "uid_list";

      ALTER TABLE report_restriction 
      MODIFY restriction_type ENUM(
        'table','identifier_list','string','integer','decimal','date','datetime','time','boolean','enum'
      ) NOT NULL;

      UPDATE report_restriction
      SET rank = rank + 1
      WHERE report_type_id IN (
        SELECT report_type_id
        FROM report_restriction
        WHERE restriction_type = "identifier_list"
      )
      ORDER BY rank DESC;

      INSERT INTO report_restriction( report_type_id, rank, name, title, mandatory, null_allowed, restriction_type, subject, description )
      SELECT report_type.id, 1, 'identifier', 'Identifier', 1, 1, 'table', 'identifier',
             'Defines which identifier to use (leave blank for native UIDs)'
      FROM report_type
      WHERE id IN( 
        SELECT report_type_id
        FROM report_restriction
        WHERE restriction_type = "identifier_list"
      );

      INSERT IGNORE INTO report_has_report_restriction( report_id, report_restriction_id, value )
      SELECT report.id, identifier_rr.id, "_NULL_"
      FROM report_restriction AS identifier_rr, report
      JOIN report_restriction on report.report_type_id = report_restriction.report_type_id
      WHERE identifier_rr.name = "identifier"
      AND report_restriction.restriction_type = "identifier_list";
    END IF;

  END //
DELIMITER ;

CALL patch_report_restriction();
DROP PROCEDURE IF EXISTS patch_report_restriction;
