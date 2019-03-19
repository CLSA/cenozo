DROP PROCEDURE IF EXISTS patch_proxy;
DELIMITER //
CREATE PROCEDURE patch_proxy()
  BEGIN

    -- determine the limesurvey database name
    SELECT REPLACE( DATABASE(), "cenozo", "limesurvey" ) INTO @limesurvey;

    SELECT COUNT(*) INTO @total
    FROM information_schema.TABLES
    WHERE table_schema = @limesurvey
    AND table_name = "survey_818761";

    IF @total THEN
      SELECT "Moving invalid \"contact form required\" proxies to \"contact required, central\"" AS "";

      SET @sql = CONCAT(
        "CREATE TEMPORARY TABLE update_proxy ",
        "SELECT proxy.id ",
        "FROM participant ",
        "JOIN participant_last_proxy ON participant.id = participant_last_proxy.participant_id ",
        "JOIN proxy ON participant_last_proxy.proxy_id = proxy.id ",
        "JOIN proxy_type on proxy.proxy_type_id = proxy_type.id ",
        "LEFT JOIN ", @limesurvey, ".survey_818761 AS survey ON uid = SUBSTRING( token, 1, 7 ) ",
        "WHERE proxy_type.name = 'consent form required' ",
        "AND survey.id IS NULL" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      UPDATE proxy
      SET proxy.proxy_type_id = ( SELECT id FROM proxy_type WHERE name = 'contact required, central' )
      WHERE id in ( SELECT * FROM update_proxy );
    END IF;

  END //
DELIMITER ;

CALL patch_proxy();
DROP PROCEDURE IF EXISTS patch_proxy;

SELECT "Transfering old \"initiated, information provider only\" proxies to \"initiated\"" AS "";

UPDATE proxy
JOIN proxy_type on proxy.proxy_type_id = proxy_type.id
SET proxy_type_id = ( SELECT id FROM proxy_type WHERE name = "initiated" )
WHERE proxy_type.name = "initiated, information provider only";
