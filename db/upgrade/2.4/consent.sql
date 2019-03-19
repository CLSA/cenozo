DROP PROCEDURE IF EXISTS patch_application;
DELIMITER //
CREATE PROCEDURE patch_application()
  BEGIN

    -- determine the limesurvey database name
    SELECT REPLACE( DATABASE(), "cenozo", "limesurvey" ) INTO @limesurvey;

    SELECT COUNT(*) INTO @total
    FROM consent
    JOIN consent_type ON consent.consent_type_id = consent_type.id
    WHERE consent_type.name = "Use Decision Maker";

    IF 0 = @total THEN
      SELECT "Adding new \"Use Decision Maker\" consent records" AS "";

      INSERT IGNORE INTO consent( participant_id, consent_type_id, accept, datetime, note )
      SELECT participant.id, consent_type.id, proxy_type.name = "initiated", proxy.datetime,
             "Automatically added when the \"Use Decision Maker\" consent type was created."
      FROM consent_type, participant
      JOIN participant_last_proxy ON participant.id = participant_last_proxy.participant_id
      JOIN proxy ON participant_last_proxy.proxy_id = proxy.id
      JOIN proxy_type on proxy.proxy_type_id = proxy_type.id
      WHERE consent_type.name = "Use Decision Maker"
      AND proxy_type.name LIKE "initiated%";

      -- now look for participants in the proxy form required proxy

      SELECT COUNT(*) INTO @total
      FROM information_schema.TABLES
      WHERE table_schema = @limesurvey
      AND table_name = "survey_818761";

      IF @total THEN
        SET @sql = CONCAT(
          "INSERT IGNORE INTO consent( participant_id, consent_type_id, accept, datetime, note ) ",
          "SELECT participant.id, consent_type.id, 818761X160X5450 = 'Y' OR 818761X160X5454 = 'Y' OR 818761X160X5454 = 'YES', ",
                 "proxy.datetime, 'Automatically added when the \"Use Decision Maker\" consent type was created.' ",
          "FROM consent_type, participant ",
          "JOIN participant_last_proxy ON participant.id = participant_last_proxy.participant_id ",
          "JOIN proxy ON participant_last_proxy.proxy_id = proxy.id ",
          "JOIN proxy_type on proxy.proxy_type_id = proxy_type.id ",
          "JOIN ", @limesurvey, ".survey_818761 AS survey ON uid = SUBSTRING( token, 1, 7 ) ",
          "WHERE consent_type.name = 'Use Decision Maker' ",
          "AND proxy_type.name = 'consent form required'" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;
    END IF;
  END //
DELIMITER ;

CALL patch_application();
DROP PROCEDURE IF EXISTS patch_application;
SELECT "Advancing consent datetimes by 12 hours when time is set to midnight (so day shows correctly when converting from UTC)" AS "";

UPDATE consent
SET datetime = datetime + INTERVAL 12 HOUR
WHERE datetime LIKE "% 00:00:00";
