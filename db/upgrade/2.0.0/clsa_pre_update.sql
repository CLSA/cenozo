-- Script used by the CLSA when upgrading to Cenozo2

DROP PROCEDURE IF EXISTS clsa_pre_update;
DELIMITER //
CREATE PROCEDURE clsa_pre_update()
  BEGIN

    -- determine the database names
    SET @beartooth = (
      SELECT unique_constraint_schema
      FROM information_schema.referential_constraints
      WHERE constraint_schema LIKE "%_beartooth"
      AND constraint_name = "fk_role_has_operation_operation_id" );

    SET @beartooth_f1 = (
      SELECT unique_constraint_schema
      FROM information_schema.referential_constraints
      WHERE constraint_schema LIKE "%_beartooth_f1"
      AND constraint_name = "fk_role_has_operation_operation_id" );

    SET @sabretooth = (
      SELECT unique_constraint_schema
      FROM information_schema.referential_constraints
      WHERE constraint_schema LIKE "%_sabretooth"
      AND constraint_name = "fk_role_has_operation_operation_id" );

    SET @sabretooth_mc = (
      SELECT unique_constraint_schema
      FROM information_schema.referential_constraints
      WHERE constraint_schema LIKE "%_sabretooth_mc"
      AND constraint_name = "fk_role_has_operation_operation_id" );

    SET @sabretooth_qc = (
      SELECT unique_constraint_schema
      FROM information_schema.referential_constraints
      WHERE constraint_schema LIKE "%_sabretooth_qc"
      AND constraint_name = "fk_role_has_operation_operation_id" );

    SET @bt_service_id = ( SELECT id FROM service WHERE name = "beartooth" );
    SET @f1_service_id = ( SELECT id FROM service WHERE name = "beartooth_f1" );
    SET @st_service_id = ( SELECT id FROM service WHERE name = "sabretooth" );
    SET @mc_service_id = ( SELECT id FROM service WHERE name = "sabretooth_mc" );

    SET @test = (
      SELECT COUNT(*)
      FROM site
      JOIN service ON site.service_id = service.id
      WHERE service.name IN ( "beartooth_f1", "sabretooth_mc" )
      AND site.name != "Simon Fraser" );
    IF @test = 0 THEN

      SELECT "This script appears to have already been run, doing nothing" AS "";

    ELSE
      -- -------------------------------------------------------------------------------------------
      -- A few preparatory steps
      -- -------------------------------------------------------------------------------------------
      SELECT "Removing all activity, away_time and user_time records" AS "";
      IF @beartooth IS NOT NULL THEN
        SET @sql = CONCAT( "TRUNCATE ", @beartooth, ".activity" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT( "TRUNCATE ", @beartooth, ".away_time" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT( "TRUNCATE ", @beartooth, ".user_time" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      IF @beartooth_f1 IS NOT NULL THEN
        SET @sql = CONCAT( "TRUNCATE ", @beartooth_f1, ".activity" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT( "TRUNCATE ", @beartooth_f1, ".away_time" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT( "TRUNCATE ", @beartooth_f1, ".user_time" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      IF @sabretooth IS NOT NULL THEN
        SET @sql = CONCAT( "TRUNCATE ", @sabretooth, ".activity" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT( "TRUNCATE ", @sabretooth, ".away_time" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT( "TRUNCATE ", @sabretooth, ".user_time" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      IF @sabretooth_mc IS NOT NULL THEN
        SET @sql = CONCAT( "TRUNCATE ", @sabretooth_mc, ".activity" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT( "TRUNCATE ", @sabretooth_mc, ".away_time" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT( "TRUNCATE ", @sabretooth_mc, ".user_time" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      IF @sabretooth_qc IS NOT NULL THEN
        SET @sql = CONCAT( "TRUNCATE ", @sabretooth_qc, ".activity" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT( "TRUNCATE ", @sabretooth_qc, ".away_time" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT( "TRUNCATE ", @sabretooth_qc, ".user_time" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      SELECT "Removing McMaster CATI sites" AS "";
      INSERT IGNORE INTO access( site_id, role_id, user_id )
      SELECT site1.id, role_id, user_id
      FROM access
      JOIN site AS site2 ON access.site_id = site2.id
      JOIN site AS site1 ON site1.name = "Sherbrooke" AND site1.service_id = @mc_service_id
      WHERE site2.name = "McMaster" AND site2.service_id = @mc_service_id
      AND role_id = ( SELECT id FROM role WHERE name = "administrator" );

      DELETE FROM access WHERE site_id IN (
        SELECT id FROM site
        WHERE name = "McMaster"
        AND service_id IN( @st_service_id, @mc_service_id )
      );

      DELETE FROM site
      WHERE name = "McMaster"
      AND service_id IN( @st_service_id, @mc_service_id );

      -- -------------------------------------------------------------------------------------------
      -- Now converting sites in cenozo's database
      -- -------------------------------------------------------------------------------------------
      IF @bt_service_id IS NOT NULL AND @f1_service_id IS NOT NULL THEN
        SET @test = (
          SELECT COUNT(*) FROM access WHERE site_id IN (
            SELECT id FROM site WHERE service_id = @f1_service_id
          )
        );
        IF @test > 0 THEN
          SELECT "Processing access table for beartooth sites" AS "";
          DELETE FROM access WHERE site_id IN (
            SELECT id FROM site WHERE service_id = @bt_service_id
          );

          UPDATE access
          JOIN site AS site2 ON access.site_id = site2.id
          JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @bt_service_id
          SET site_id = site1.id
          WHERE site_id IN ( SELECT id FROM site WHERE service_id = @f1_service_id );
        END IF;
      END IF;

      IF @st_service_id IS NOT NULL AND @mc_service_id IS NOT NULL THEN
        SET @test = (
          SELECT COUNT(*) FROM access WHERE site_id IN (
            SELECT id FROM site WHERE service_id = @mc_service_id AND name != "Simon Fraser"
          )
        );
        IF @test > 0 THEN
          SELECT "Processing access table for sabretooth sites" AS "";
          DELETE FROM access WHERE site_id IN (
            SELECT id FROM site WHERE service_id = @st_service_id AND name != "Victoria"
          );

          UPDATE access
          JOIN site AS site2 ON access.site_id = site2.id
          JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_service_id
          SET site_id = site1.id
          WHERE site_id IN ( SELECT id FROM site WHERE service_id = @mc_service_id );
        END IF;
      END IF;

      -- -------------------------------------------------------------------------------------------
      IF @bt_service_id IS NOT NULL AND @f1_service_id IS NOT NULL THEN
        SET @test = (
          SELECT COUNT(*) FROM jurisdiction WHERE site_id IN (
            SELECT id FROM site WHERE service_id = @f1_service_id
          )
        );
        IF @test > 0 THEN
          SELECT "Processing jurisdiction table for beartooth sites" AS "";
          UPDATE jurisdiction
          JOIN site AS site2 ON site_id = site2.id
          JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @bt_service_id
          SET site_id = site1.id
          WHERE site_id IN ( SELECT id FROM site WHERE service_id = @f1_service_id );
        END IF;
      END IF;

      -- -------------------------------------------------------------------------------------------
      IF @st_service_id IS NOT NULL AND @mc_service_id IS NOT NULL THEN
        SET @test = (
          SELECT COUNT(*) FROM region_site WHERE site_id IN (
            SELECT id FROM site WHERE service_id = @mc_service_id AND name != "Simon Fraser"
          )
        );
        IF @test > 0 THEN
          SELECT "Processing region_site table for sabretooth sites" AS "";
          UPDATE region_site
          JOIN site AS site2 ON site_id = site2.id
          JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_service_id
          SET site_id = site1.id
          WHERE site_id IN ( SELECT id FROM site WHERE service_id = @mc_service_id );

          -- now remove duplicates
          CREATE TEMPORARY TABLE temp
          SELECT * FROM region_site
          GROUP BY site_id, region_id, language_id
          HAVING COUNT(*) > 1
          ORDER BY id;
          INSERT INTO temp
          SELECT * FROM region_site
          GROUP BY site_id, region_id, language_id
          HAVING COUNT(*) = 1
          ORDER BY id;

          TRUNCATE region_site;
          INSERT INTO region_site SELECT * FROM temp ORDER BY id;
        END IF;
      END IF;

      -- -------------------------------------------------------------------------------------------
      IF @bt_service_id IS NOT NULL AND @f1_service_id IS NOT NULL THEN
        SELECT "Removing F1 quotas" AS "";
        DELETE FROM quota WHERE site_id IN (
          SELECT id FROM site WHERE service_id = @f1_service_id
        );
      END IF;

      IF @st_service_id IS NOT NULL AND @mc_service_id IS NOT NULL THEN
        SELECT "Removing MC quotas" AS "";
        DELETE FROM quota WHERE site_id IN (
          SELECT id FROM site WHERE service_id = @mc_service_id AND name != "Simon Fraser"
        );
      END IF;

      -- -------------------------------------------------------------------------------------------
      IF @bt_service_id IS NOT NULL AND @f1_service_id IS NOT NULL THEN
        SELECT "Processing service_has_participant table for beartooth sites" AS "";
        UPDATE service_has_participant
        JOIN site AS site2 ON preferred_site_id = site2.id
        JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @bt_service_id
        SET preferred_site_id = site1.id
        WHERE preferred_site_id IN ( SELECT id FROM site WHERE service_id = @f1_service_id );
      END IF;

      IF @st_service_id IS NOT NULL AND @mc_service_id IS NOT NULL THEN
        SELECT "Processing service_has_participant table for sabretooth sites" AS "";
        UPDATE service_has_participant
        JOIN site AS site2 ON preferred_site_id = site2.id
        JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_service_id
        SET preferred_site_id = site1.id
        WHERE preferred_site_id IN ( SELECT id FROM site WHERE service_id = @mc_service_id );
      END IF;

      -- -------------------------------------------------------------------------------------------
      -- Now we convert sites in Beartooth databases
      -- -------------------------------------------------------------------------------------------

      -- TODO

      -- -------------------------------------------------------------------------------------------
      -- Now we convert sites in Sabretooth databases
      -- -------------------------------------------------------------------------------------------
      SELECT "Converting assignment sites for MC" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_mc, ".assignment ",
        "JOIN site AS site2 ON assignment.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_service_id ",
        "SET assignment.site_id = site1.id ",
        "WHERE site2.service_id = @mc_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Converting away_time sites for MC" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_mc, ".away_time ",
        "JOIN site AS site2 ON away_time.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_service_id ",
        "SET away_time.site_id = site1.id ",
        "WHERE site2.service_id = @mc_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Converting user_time sites for MC" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_mc, ".user_time ",
        "JOIN site AS site2 ON user_time.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_service_id ",
        "SET user_time.site_id = site1.id ",
        "WHERE site2.service_id = @mc_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Converting shift sites for MC" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_mc, ".shift ",
        "JOIN site AS site2 ON shift.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_service_id ",
        "SET shift.site_id = site1.id ",
        "WHERE site2.service_id = @mc_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Converting shift_template sites for MC" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_mc, ".shift_template ",
        "JOIN site AS site2 ON shift_template.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_service_id ",
        "SET shift_template.site_id = site1.id ",
        "WHERE site2.service_id = @mc_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Converting queue_has_participant sites for MC" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_mc, ".queue_has_participant ",
        "JOIN site AS site2 ON queue_has_participant.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_service_id ",
        "SET queue_has_participant.site_id = site1.id ",
        "WHERE site2.service_id = @mc_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Converting queue_state sites for MC" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_mc, ".queue_state ",
        "JOIN site AS site2 ON queue_state.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_service_id ",
        "SET queue_state.site_id = site1.id ",
        "WHERE site2.service_id = @mc_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Converting queue_state sites for MC" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_mc, ".queue_state ",
        "JOIN site AS site2 ON queue_state.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_service_id ",
        "SET queue_state.site_id = site1.id ",
        "WHERE site2.service_id = @mc_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Replacing MC sites in setting_values" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_mc, ".setting_value ",
        "JOIN site AS site2 ON site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_service_id ",
        "SET site_id = site1.id ",
        "WHERE site2.service_id = @mc_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Replacing MC sites in system_messages" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_mc, ".system_message ",
        "JOIN site AS site2 ON site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_service_id ",
        "SET site_id = site1.id ",
        "WHERE site2.service_id = @mc_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      -- Finally, we delete the old sites
      -- -------------------------------------------------------------------------------------------
      IF @bt_service_id IS NOT NULL AND @f1_service_id IS NOT NULL THEN
        SELECT "Removing F1 sites" AS "";
        SET @sql = CONCAT( "DELETE FROM site WHERE service_id = @f1_service_id" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      IF @st_service_id IS NOT NULL AND @mc_service_id IS NOT NULL THEN
        SELECT "Removing MC sites" AS "";
        SET @sql = CONCAT( "DELETE FROM site WHERE service_id = @mc_service_id AND name != 'Simon Fraser'" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

    END IF;

  END //
DELIMITER ;

CALL clsa_pre_update();
DROP PROCEDURE IF EXISTS clsa_pre_update;
