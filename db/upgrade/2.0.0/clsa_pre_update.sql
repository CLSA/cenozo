-- Script used by the CLSA when upgrading to Cenozo2

DROP PROCEDURE IF EXISTS clsa_pre_update;
DELIMITER //
CREATE PROCEDURE clsa_pre_update()
  BEGIN

    -- determine the database names
    SET @beartooth_f1 = (
      SELECT unique_constraint_schema
      FROM information_schema.referential_constraints
      WHERE constraint_schema LIKE "%_beartooth_f1"
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
      WHERE service.name IN ( "beartooth_f1", "sabretooth_mc" ) );
    IF @test = 0 THEN

      SELECT "This script appears to have already been run, doing nothing" AS "";

    ELSE
      -- -------------------------------------------------------------------------------------------
      -- Pre-processing
      -- -------------------------------------------------------------------------------------------
      IF @st_service_id IS NOT NULL AND @mc_service_id IS NOT NULL THEN
        SELECT "Converting SFU from MC to Baseline" AS "";
        SET @sql = CONCAT(
          "UPDATE site SET service_id = ", @st_service_id, " ",
          "WHERE name = 'Simon Fraser' ",
          "AND service_id = ", @mc_service_id );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      -- -------------------------------------------------------------------------------------------
      -- We begin by converting sites in cenozo's database
      -- -------------------------------------------------------------------------------------------
      IF @bt_service_id IS NOT NULL AND @f1_service_id IS NOT NULL THEN
        SELECT "Processing access table for beartooth sites" AS "";
        SET @sql = CONCAT(
          "DELETE FROM access WHERE site_id IN ( ","
            SELECT id FROM site WHERE service_id = ", @bt_service_id,
          " )" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT(
          "UPDATE access ",
          "JOIN site AS site2 ON access.site_id = site2.id ",
          "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = ", @bt_service_id, " ",
          "SET site_id = site1.id ",
          "WHERE site_id IN ( SELECT id FROM site WHERE service_id = ", @f1_service_id, " )" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      IF @st_service_id IS NOT NULL AND @mc_service_id IS NOT NULL THEN
        SELECT "Processing access table for sabretooth sites" AS "";
        SET @sql = CONCAT(
          "DELETE FROM access WHERE site_id IN ( ",
            "SELECT id FROM site WHERE service_id = ", @st_service_id,
          " )" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT(
          "UPDATE access ",
          "JOIN site AS site2 ON access.site_id = site2.id ",
          "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = ", @st_service_id, " ",
          "SET site_id = site1.id ",
          "WHERE site_id IN ( SELECT id FROM site WHERE service_id = ", @mc_service_id, " )" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      -- -------------------------------------------------------------------------------------------
      IF @bt_service_id IS NOT NULL AND @f1_service_id IS NOT NULL THEN
        SELECT "Processing jurisdiction table for beartooth sites" AS "";
        SET @sql = CONCAT(
          "DELETE FROM jurisdiction WHERE site_id IN ( ",
            "SELECT id FROM site WHERE service_id = ", @bt_service_id,
          " )" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT(
          "UPDATE jurisdiction ",
          "JOIN site AS site2 ON site_id = site2.id ",
          "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = ", @bt_service_id, " ",
          "SET site_id = site1.id ",
          "WHERE site_id IN ( SELECT id FROM site WHERE service_id = ", @f1_service_id, " )" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      IF @st_service_id IS NOT NULL AND @mc_service_id IS NOT NULL THEN
        SELECT "Processing jurisdiction table for sabretooth sites" AS "";
        SET @sql = CONCAT(
          "DELETE FROM jurisdiction WHERE site_id IN ( ",
            "SELECT id FROM site WHERE service_id = ", @st_service_id,
          " )" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT(
          "UPDATE jurisdiction ",
          "JOIN site AS site2 ON site_id = site2.id ",
          "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = ", @st_service_id, " ",
          "SET site_id = site1.id ",
          "WHERE site_id IN ( SELECT id FROM site WHERE service_id = ", @mc_service_id, " )" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      -- -------------------------------------------------------------------------------------------
      IF @bt_service_id IS NOT NULL AND @f1_service_id IS NOT NULL THEN
        SELECT "Processing region_site table for beartooth sites" AS "";
        SET @sql = CONCAT(
          "DELETE FROM region_site WHERE site_id IN ( ",
            "SELECT id FROM site WHERE service_id = ", @bt_service_id,
          " )" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT(
          "UPDATE region_site ",
          "JOIN site AS site2 ON site_id = site2.id ",
          "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = ", @bt_service_id, " ",
          "SET site_id = site1.id ",
          "WHERE site_id IN ( SELECT id FROM site WHERE service_id = ", @f1_service_id, " )" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      IF @st_service_id IS NOT NULL AND @mc_service_id IS NOT NULL THEN
        SELECT "Processing region_site table for sabretooth sites" AS "";
        SET @sql = CONCAT(
          "DELETE FROM region_site WHERE site_id IN ( ",
            "SELECT id FROM site WHERE service_id = ", @st_service_id,
          " )" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT(
          "UPDATE region_site ",
          "JOIN site AS site2 ON site_id = site2.id ",
          "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = ", @st_service_id, " ",
          "SET site_id = site1.id ",
          "WHERE site_id IN ( SELECT id FROM site WHERE service_id = ", @mc_service_id, " )" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      -- -------------------------------------------------------------------------------------------
      IF @bt_service_id IS NOT NULL AND @f1_service_id IS NOT NULL THEN
        SELECT "Removing F1 quotas" AS "";
        SET @sql = CONCAT(
          "DELETE FROM quota WHERE site_id IN ( ",
            "SELECT id FROM site WHERE service_id = ", @f1_service_id,
          " )" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      IF @st_service_id IS NOT NULL AND @mc_service_id IS NOT NULL THEN
        SELECT "Removing MC quotas" AS "";
        SET @sql = CONCAT(
          "DELETE FROM quota WHERE site_id IN ( ",
            "SELECT id FROM site WHERE service_id = ", @mc_service_id,
          " )" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      -- -------------------------------------------------------------------------------------------
      IF @bt_service_id IS NOT NULL AND @f1_service_id IS NOT NULL THEN
        SELECT "Processing service_has_participant table for beartooth sites" AS "";
        SET @sql = CONCAT(
          "UPDATE service_has_participant ",
          "JOIN site AS site2 ON preferred_site_id = site2.id ",
          "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = ", @bt_service_id, " ",
          "SET preferred_site_id = site1.id ",
          "WHERE preferred_site_id IN ( SELECT id FROM site WHERE service_id = ", @f1_service_id, " )" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      IF @st_service_id IS NOT NULL AND @mc_service_id IS NOT NULL THEN
        SELECT "Processing service_has_participant table for sabretooth sites" AS "";
        SET @sql = CONCAT(
          "UPDATE service_has_participant ",
          "JOIN site AS site2 ON preferred_site_id = site2.id ",
          "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = ", @st_service_id, " ",
          "SET preferred_site_id = site1.id ",
          "WHERE preferred_site_id IN ( SELECT id FROM site WHERE service_id = ", @mc_service_id, " )" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      -- -------------------------------------------------------------------------------------------
      -- Now we convert sites in Beartooth databases
      -- -------------------------------------------------------------------------------------------

      -- TODO

      -- -------------------------------------------------------------------------------------------
      SELECT "Removing all activity, away_time and user_time records from MC and QC" AS "";
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

      -- -------------------------------------------------------------------------------------------
      SELECT "Converting assignment sites for MC" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_mc, ".assignment ",
        "JOIN site AS site2 ON assignment.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = ", @st_service_id, " ",
        "SET assignment.site_id = site1.id" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Converting away_time sites for MC" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_mc, ".away_time ",
        "JOIN site AS site2 ON away_time.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = ", @st_service_id, " ",
        "SET away_time.site_id = site1.id" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Converting user_time sites for MC" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_mc, ".user_time ",
        "JOIN site AS site2 ON user_time.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = ", @st_service_id, " ",
        "SET user_time.site_id = site1.id" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Converting shift sites for MC" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_mc, ".shift ",
        "JOIN site AS site2 ON shift.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = ", @st_service_id, " ",
        "SET shift.site_id = site1.id" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Converting shift_template sites for MC" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_mc, ".shift_template ",
        "JOIN site AS site2 ON shift_template.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = ", @st_service_id, " ",
        "SET shift_template.site_id = site1.id" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Converting queue_has_participant sites for MC" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_mc, ".queue_has_participant ",
        "JOIN site AS site2 ON queue_has_participant.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = ", @st_service_id, " ",
        "SET queue_has_participant.site_id = site1.id" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Converting queue_state sites for MC" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_mc, ".queue_state ",
        "JOIN site AS site2 ON queue_state.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = ", @st_service_id, " ",
        "SET queue_state.site_id = site1.id" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Converting queue_state sites for MC" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_mc, ".queue_state ",
        "JOIN site AS site2 ON queue_state.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = ", @st_service_id, " ",
        "SET queue_state.site_id = site1.id" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Replacing MC sites in setting_values" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_mc, ".setting_value ",
        "JOIN site AS site2 ON site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = ", @st_service_id, " ",
        "SET site_id = site1.id" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Replacing MC sites in system_messages" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_mc, ".system_message ",
        "JOIN site AS site2 ON site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = ", @st_service_id, " ",
        "SET site_id = site1.id" );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      -- Finally, we delete the old sites
      -- -------------------------------------------------------------------------------------------
      IF @bt_service_id IS NOT NULL AND @f1_service_id IS NOT NULL THEN
        SELECT "Removing F1 sites" AS "";
        SET @sql = CONCAT( "DELETE FROM site WHERE service_id = ", @f1_service_id );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      IF @st_service_id IS NOT NULL AND @mc_service_id IS NOT NULL THEN
        SELECT "Removing MC sites" AS "";
        SET @sql = CONCAT( "DELETE FROM site WHERE service_id = ", @mc_service_id );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

    END IF;

  END //
DELIMITER ;

CALL clsa_pre_update();
DROP PROCEDURE IF EXISTS clsa_pre_update;
