DROP PROCEDURE IF EXISTS patch_script;
DELIMITER //
CREATE PROCEDURE patch_script()
  BEGIN

    -- determine the limesurvey database name
    SELECT REPLACE( DATABASE(), "cenozo", "limesurvey" ) INTO @limesurvey;

    SELECT "Adding decedent script" AS "";

    SET @sql = CONCAT(
      "INSERT IGNORE INTO script( name, sid, repeated, special ) ",
      "SELECT surveyls_title, surveyls_survey_id, 0, 1 ",
      "FROM ", @limesurvey, ".surveys_languagesettings ",
      "WHERE surveyls_language = 'en' ",
      "AND surveyls_title LIKE '%decedent%'" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

  END //
DELIMITER ;

CALL patch_script();
DROP PROCEDURE IF EXISTS patch_script;
