DROP PROCEDURE IF EXISTS patch_limesurvey_proxy_initiation;
DELIMITER //
CREATE PROCEDURE patch_limesurvey_proxy_initiation()
  BEGIN

    -- determine the limesurvey database name
    SELECT REPLACE( DATABASE(), "cenozo", "limesurvey" ) INTO @limesurvey;

    -- determine the proxy initiation script's sid
    SELECT CONCAT( @limesurvey, ".tokens_", sid ),
           CONCAT( @limesurvey, ".survey_", sid )
    INTO @tokens, @survey
    FROM script
    WHERE name LIKE "%Proxy Initiation%";

    if @tokens IS NOT NULL THEN
      SELECT "Converting proxy initiation script to single-use only" AS "";

      -- delete all empty surveys
      SET @sql = CONCAT( "DELETE FROM ", @survey, " WHERE submitdate is NULL" );
      PREPARE statement FROM @sql; EXECUTE statement; DEALLOCATE PREPARE statement;

      -- delete orphaned tokens
      SET @sql = CONCAT(
        "DELETE FROM ", @tokens, " ",
        "WHERE tid IN( ",
          "SELECT * FROM ( ",
            "SELECT tid FROM ", @tokens, " ",
            "LEFT JOIN ", @survey, " AS survey USING ( token ) ",
            "WHERE survey.id IS NULL ",
          ") AS t ",
        ")"
      );
      PREPARE statement FROM @sql; EXECUTE statement; DEALLOCATE PREPARE statement;

      -- get a list of the most recent tokens for all UIDs with multiple entries
      SET @sql = CONCAT(
        "CREATE TEMPORARY TABLE keep ",
        "SELECT max( tid ) AS last_tid, SUBSTRING( token, 1, 7 ) AS uid ",
        "FROM ", @tokens, " ",
        "JOIN ", @survey, " AS survey USING ( token ) ",
        "WHERE survey.submitdate IS NOT NULL ",
        "GROUP BY SUBSTRING( token, 1, 7 ) ",
        "HAVING COUNT(*) > 1"
      );
      PREPARE statement FROM @sql; EXECUTE statement; DEALLOCATE PREPARE statement;

      -- delete all but the most recent entry for all UIDs
      SET @sql = CONCAT(
        "DELETE FROM ", @tokens, " ",
        "WHERE tid IN ( ",
          "SELECT * FROM ( ",
            "SELECT tid ",
            "FROM ", @tokens, " ",
            "JOIN keep ON SUBSTRING( token, 1, 7 ) = uid ",
            "AND tid != last_tid ",
          ") AS t ",
        ")"
      );
      PREPARE statement FROM @sql; EXECUTE statement; DEALLOCATE PREPARE statement;

      -- delete all orphaned tokens
      SET @sql = CONCAT(
        "DELETE FROM ", @survey, " ",
        "WHERE id IN ( ",
          "SELECT * FROM ( ",
            "SELECT id ",
            "FROM ", @survey, " ",
            "LEFT JOIN ", @tokens, " AS tokens USING ( token ) ",
            "WHERE tokens.tid IS NULL ",
          ") AS t ",
        ")"
      );
      PREPARE statement FROM @sql; EXECUTE statement; DEALLOCATE PREPARE statement;

      -- change all token values to non-repeating script style tokens
      SET @sql = CONCAT( "UPDATE ", @tokens, " SET token = SUBSTRING( token, 1, 7 )" );
      PREPARE statement FROM @sql; EXECUTE statement; DEALLOCATE PREPARE statement;
      SET @sql = CONCAT( "UPDATE ", @survey, " SET token = SUBSTRING( token, 1, 7 )" );
      PREPARE statement FROM @sql; EXECUTE statement; DEALLOCATE PREPARE statement;

    END IF;

  END //
DELIMITER ;

CALL patch_limesurvey_proxy_initiation();
DROP PROCEDURE IF EXISTS patch_limesurvey_proxy_initiation;
