DROP PROCEDURE IF EXISTS patch_address;
DELIMITER //
CREATE PROCEDURE patch_address()
  BEGIN

    SELECT COUNT(*) INTO @test
    FROM information_schema.TABLES
    WHERE table_schema = DATABASE()
    AND table_name = "address";

    IF @test = 1 THEN
      SELECT "Updating timezone/DST for addresses in BC, Alberta, Saskatchewan and Manitoba" AS "";

      -- first drop triggers to speed things up
      DROP TRIGGER address_AFTER_UPDATE;
      DROP TRIGGER address_BEFORE_UPDATE;

      UPDATE address
      JOIN region ON address.region_id = region.id
      SET
        address.timezone_offset = IF(
          region.name IN( "British Columbia", "Yukon" )
          AND address.timezone_offset = -8
          AND address.daylight_savings = 1,
          -7, -- permanent PDT
          IF(
            region.name IN( "British Columbia", "Alberta", "Northwest Territories", "Saskatchewan" )
            AND address.timezone_offset = -7
            AND address.daylight_savings = 1,
            -6, -- permanent MDT
            IF(
              region.name IN( "Saskatchewan", "Manitoba" )
              AND address.timezone_offset = -6
              AND address.daylight_savings = 1,
              -5, -- permanent CDT
              address.timezone_offset -- leave it unchanged
            )
          )
        ),
        daylight_savings = 0
      WHERE region.name IN(
        "Yukon",
        "British Columbia",
        "Alberta",
        "Northwest Territories",
        "Saskatchewan",
        "Manitoba"
      )
      AND timezone_offset IN (-8, -7, -6)
      AND daylight_savings = 1;

      -- now re-create the triggers
      SET @sql = "
        CREATE TRIGGER address_AFTER_UPDATE AFTER UPDATE ON address FOR EACH ROW
        BEGIN
          IF NEW.alternate_id IS NOT NULL THEN
            CALL update_alternate_first_address( NEW.alternate_id );
          ELSE
            CALL update_participant_first_address( NEW.participant_id );
            CALL update_participant_primary_address( NEW.participant_id );
            CALL contact_changed( NEW.participant_id );
          END IF;
        END
      ";
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      SET @sql = "
        CREATE TRIGGER address_BEFORE_UPDATE BEFORE UPDATE ON address FOR EACH ROW
        BEGIN
          IF ( NEW.alternate_id IS NULL AND NEW.participant_id IS NULL ) or
             ( NEW.alternate_id IS NOT NULL AND NEW.participant_id IS NOT NULL ) THEN

            SIGNAL SQLSTATE '23000'
            SET MESSAGE_TEXT = \"Either column 'alternate_id' or 'participant_id' cannot be null\",
            MYSQL_ERRNO = 1048;
          ELSE
            SET @test = (
              SELECT COUNT(*) FROM address
              WHERE rank = NEW.rank
              AND alternate_id <=> NEW.alternate_id
              AND participant_id <=> NEW.participant_id
              AND address.id != NEW.id
            );
            IF @test > 0 THEN

              SET @sql = CONCAT(
                \"Duplicate entry '\",
                IFNULL( NEW.alternate_id, \"NULL\" ), \"-\", IFNULL( NEW.participant_id, \"NULL\" ), \"-\", NEW.rank,
                \"' for key 'uq_alternate_id_participant_id_rank'\"
              );
              SIGNAL SQLSTATE '23000' SET MESSAGE_TEXT = @sql, MYSQL_ERRNO = 1062;
            END IF;
          END IF;
        END
      ";
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;
    END IF;

  END //
DELIMITER ;

CALL patch_address();
DROP PROCEDURE IF EXISTS patch_address;
