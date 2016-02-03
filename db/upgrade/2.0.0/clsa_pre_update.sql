-- Script used by the CLSA when upgrading to Cenozo2

DROP PROCEDURE IF EXISTS clsa_pre_update;
DELIMITER //
CREATE PROCEDURE clsa_pre_update()
  BEGIN

    -- determine the database names
    SET @beartooth_bl = (
      SELECT unique_constraint_schema
      FROM information_schema.referential_constraints
      WHERE constraint_schema = CONCAT( SUBSTRING( USER(), 1, LOCATE( '@', USER() )-1 ), "_beartooth" )
      AND constraint_name = "fk_role_has_operation_operation_id" );

    SET @beartooth_f1 = (
      SELECT unique_constraint_schema
      FROM information_schema.referential_constraints
      WHERE constraint_schema = CONCAT( SUBSTRING( USER(), 1, LOCATE( '@', USER() )-1 ), "_beartooth_f1" )
      AND constraint_name = "fk_role_has_operation_operation_id" );

    SET @cedar_bl = (
      SELECT unique_constraint_schema
      FROM information_schema.referential_constraints
      WHERE constraint_schema = CONCAT( SUBSTRING( USER(), 1, LOCATE( '@', USER() )-1 ), "_cedar" )
      AND constraint_name = "fk_role_has_operation_operation_id" );

    SET @cedar_f1 = (
      SELECT unique_constraint_schema
      FROM information_schema.referential_constraints
      WHERE constraint_schema = CONCAT( SUBSTRING( USER(), 1, LOCATE( '@', USER() )-1 ), "_cedar_f1" )
      AND constraint_name = "fk_role_has_operation_operation_id" );

    SET @mastodon = (
      SELECT unique_constraint_schema
      FROM information_schema.referential_constraints
      WHERE constraint_schema = CONCAT( SUBSTRING( USER(), 1, LOCATE( '@', USER() )-1 ), "_mastodon" )
      AND constraint_name = "fk_role_has_operation_operation_id" );

    SET @sabretooth_bl = (
      SELECT unique_constraint_schema
      FROM information_schema.referential_constraints
      WHERE constraint_schema = CONCAT( SUBSTRING( USER(), 1, LOCATE( '@', USER() )-1 ), "_sabretooth" )
      AND constraint_name = "fk_role_has_operation_operation_id" );

    SET @sabretooth_mc = (
      SELECT unique_constraint_schema
      FROM information_schema.referential_constraints
      WHERE constraint_schema = CONCAT( SUBSTRING( USER(), 1, LOCATE( '@', USER() )-1 ), "_sabretooth_mc" )
      AND constraint_name = "fk_role_has_operation_operation_id" );

    SET @sabretooth_f1 = (
      SELECT unique_constraint_schema
      FROM information_schema.referential_constraints
      WHERE constraint_schema = CONCAT( SUBSTRING( USER(), 1, LOCATE( '@', USER() )-1 ), "_sabretooth_f1" )
      AND constraint_name = "fk_role_has_operation_operation_id" );

    SET @sabretooth_qc = (
      SELECT unique_constraint_schema
      FROM information_schema.referential_constraints
      WHERE constraint_schema = CONCAT( SUBSTRING( USER(), 1, LOCATE( '@', USER() )-1 ), "_sabretooth_qc" )
      AND constraint_name = "fk_role_has_operation_operation_id" );

    SET @bt_bl_service_id = ( SELECT id FROM service WHERE name = "beartooth" );
    SET @bt_f1_service_id = ( SELECT id FROM service WHERE name = "beartooth_f1" );
    SET @ce_bl_service_id = ( SELECT id FROM service WHERE name = "cedar" );
    SET @ce_f1_service_id = ( SELECT id FROM service WHERE name = "cedar_f1" );
    SET @ma_service_id = ( SELECT id FROM service WHERE name = "mastodon" );
    SET @st_bl_service_id = ( SELECT id FROM service WHERE name = "sabretooth" );
    SET @st_mc_service_id = ( SELECT id FROM service WHERE name = "sabretooth_mc" );
    SET @st_f1_service_id = ( SELECT id FROM service WHERE name = "sabretooth_f1" );
    SET @st_qc_service_id = ( SELECT id FROM service WHERE name = "sabretooth_qc" );

    SET @test = (
      SELECT COUNT(*)
      FROM site
      JOIN service ON site.service_id = service.id
      WHERE service.name IN ( "beartooth_f1", "sabretooth_mc", "sabretooth_f1" )
      AND site.name != "Simon Fraser" );
    IF @test = 0 THEN

      SELECT "This script appears to have already been run, doing nothing" AS "";

    ELSE
      -- -------------------------------------------------------------------------------------------
      -- A few preparatory steps
      -- -------------------------------------------------------------------------------------------
      SELECT "Removing all activity, away_time and user_time records" AS "";
      IF @beartooth_bl IS NOT NULL THEN
        SET @sql = CONCAT( "TRUNCATE ", @beartooth_bl, ".activity" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT( "TRUNCATE ", @beartooth_bl, ".away_time" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT( "TRUNCATE ", @beartooth_bl, ".user_time" );
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

      IF @cedar_bl IS NOT NULL THEN
        SET @sql = CONCAT( "TRUNCATE ", @cedar_bl, ".activity" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT( "TRUNCATE ", @cedar_bl, ".away_time" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT( "TRUNCATE ", @cedar_bl, ".user_time" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      IF @cedar_f1 IS NOT NULL THEN
        SET @sql = CONCAT( "TRUNCATE ", @cedar_f1, ".activity" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT( "TRUNCATE ", @cedar_f1, ".away_time" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT( "TRUNCATE ", @cedar_f1, ".user_time" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      IF @mastodon IS NOT NULL THEN
        SET @sql = CONCAT( "TRUNCATE ", @mastodon, ".activity" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT( "TRUNCATE ", @mastodon, ".away_time" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT( "TRUNCATE ", @mastodon, ".user_time" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      IF @sabretooth_bl IS NOT NULL THEN
        SET @sql = CONCAT( "TRUNCATE ", @sabretooth_bl, ".activity" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT( "TRUNCATE ", @sabretooth_bl, ".away_time" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT( "TRUNCATE ", @sabretooth_bl, ".user_time" );
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

      IF @sabretooth_f1 IS NOT NULL THEN
        SET @sql = CONCAT( "TRUNCATE ", @sabretooth_f1, ".activity" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT( "TRUNCATE ", @sabretooth_f1, ".away_time" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT( "TRUNCATE ", @sabretooth_f1, ".user_time" );
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

      SELECT "Transfering administrator roles from McMaster to Sherbrooke for all CATI sites" AS "";

      INSERT IGNORE INTO access( site_id, role_id, user_id )
      SELECT site1.id, role_id, user_id
      FROM access
      JOIN site AS site2 ON access.site_id = site2.id
      JOIN site AS site1 ON site1.name = "Sherbrooke" AND site1.service_id = @st_bl_service_id
      WHERE site2.name = "McMaster" AND site2.service_id = @st_bl_service_id
      AND role_id = ( SELECT id FROM role WHERE name = "administrator" );

      INSERT IGNORE INTO access( site_id, role_id, user_id )
      SELECT site1.id, role_id, user_id
      FROM access
      JOIN site AS site2 ON access.site_id = site2.id
      JOIN site AS site1 ON site1.name = "Sherbrooke" AND site1.service_id = @st_mc_service_id
      WHERE site2.name = "McMaster" AND site2.service_id = @st_mc_service_id
      AND role_id = ( SELECT id FROM role WHERE name = "administrator" );

      INSERT IGNORE INTO access( site_id, role_id, user_id )
      SELECT site1.id, role_id, user_id
      FROM access
      JOIN site AS site2 ON access.site_id = site2.id
      JOIN site AS site1 ON site1.name = "Sherbrooke" AND site1.service_id = @st_f1_service_id
      WHERE site2.name = "McMaster" AND site2.service_id = @st_f1_service_id
      AND role_id = ( SELECT id FROM role WHERE name = "administrator" );

      SELECT "Removing McMaster CATI sites" AS "";

      DELETE FROM access WHERE site_id IN (
        SELECT id FROM site
        WHERE name = "McMaster"
        AND service_id IN( @st_bl_service_id, @st_mc_service_id, @st_f1_service_id )
      );

      DELETE FROM site
      WHERE name = "McMaster"
      AND service_id IN( @st_bl_service_id, @st_mc_service_id, @st_f1_service_id );

      -- -------------------------------------------------------------------------------------------
      -- Now converting sites in cenozo's database
      -- -------------------------------------------------------------------------------------------
      IF @beartooth_bl IS NOT NULL THEN
        SELECT "Processing access table for beartooth sites" AS "";

        SET @sql = CONCAT(
          "CREATE TABLE IF NOT EXISTS ", @beartooth_bl, ".access ( ",
            "id INT UNSIGNED NOT NULL AUTO_INCREMENT, ",
            "update_timestamp TIMESTAMP NOT NULL, ",
            "create_timestamp TIMESTAMP NOT NULL, ",
            "user_id INT UNSIGNED NOT NULL, ",
            "role_id INT UNSIGNED NOT NULL, ",
            "site_id INT UNSIGNED NOT NULL, ",
            "datetime DATETIME NULL, ",
            "microtime DOUBLE NULL, ",
            "PRIMARY KEY (id), ",
            "INDEX fk_user_id (user_id ASC), ",
            "INDEX fk_role_id (role_id ASC), ",
            "INDEX fk_site_id (site_id ASC), ",
            "UNIQUE INDEX uq_user_id_role_id_site_id (user_id ASC, role_id ASC, site_id ASC), ",
            "INDEX datetime_microtime (datetime ASC, microtime ASC), ",
            "CONSTRAINT fk_access_user_id ",
              "FOREIGN KEY (user_id) ",
              "REFERENCES ", DATABASE(), ".user (id) ",
              "ON DELETE NO ACTION ",
              "ON UPDATE NO ACTION, ",
            "CONSTRAINT fk_access_role_id ",
              "FOREIGN KEY (role_id) ",
              "REFERENCES ", DATABASE(), ".role (id) ",
              "ON DELETE NO ACTION ",
              "ON UPDATE NO ACTION, ",
            "CONSTRAINT fk_access_site_id ",
              "FOREIGN KEY (site_id) ",
              "REFERENCES ", DATABASE(), ".site (id) ",
              "ON DELETE NO ACTION ",
              "ON UPDATE NO ACTION) ",
          "ENGINE = InnoDB" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT(
          "INSERT IGNORE INTO ", @beartooth_bl, ".access( user_id, role_id, site_id ) ",
          "SELECT access.user_id, access.role_id, site1.id ",
          "FROM access ",
          "JOIN site AS site2 ON access.site_id = site2.id ",
          "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = ", @bt_bl_service_id, " ",
          "WHERE site_id IN ( SELECT id FROM site WHERE service_id = ", @bt_bl_service_id, " )" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      IF @beartooth_f1 IS NOT NULL THEN
        SELECT "Processing access table for beartooth F1 sites" AS "";

        SET @sql = CONCAT(
          "CREATE TABLE IF NOT EXISTS ", @beartooth_f1, ".access ( ",
            "id INT UNSIGNED NOT NULL AUTO_INCREMENT, ",
            "update_timestamp TIMESTAMP NOT NULL, ",
            "create_timestamp TIMESTAMP NOT NULL, ",
            "user_id INT UNSIGNED NOT NULL, ",
            "role_id INT UNSIGNED NOT NULL, ",
            "site_id INT UNSIGNED NOT NULL, ",
            "datetime DATETIME NULL, ",
            "microtime DOUBLE NULL, ",
            "PRIMARY KEY (id), ",
            "INDEX fk_user_id (user_id ASC), ",
            "INDEX fk_role_id (role_id ASC), ",
            "INDEX fk_site_id (site_id ASC), ",
            "UNIQUE INDEX uq_user_id_role_id_site_id (user_id ASC, role_id ASC, site_id ASC), ",
            "INDEX datetime_microtime (datetime ASC, microtime ASC), ",
            "CONSTRAINT fk_access_user_id ",
              "FOREIGN KEY (user_id) ",
              "REFERENCES ", DATABASE(), ".user (id) ",
              "ON DELETE NO ACTION ",
              "ON UPDATE NO ACTION, ",
            "CONSTRAINT fk_access_role_id ",
              "FOREIGN KEY (role_id) ",
              "REFERENCES ", DATABASE(), ".role (id) ",
              "ON DELETE NO ACTION ",
              "ON UPDATE NO ACTION, ",
            "CONSTRAINT fk_access_site_id ",
              "FOREIGN KEY (site_id) ",
              "REFERENCES ", DATABASE(), ".site (id) ",
              "ON DELETE NO ACTION ",
              "ON UPDATE NO ACTION) ",
          "ENGINE = InnoDB" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT(
          "INSERT IGNORE INTO ", @beartooth_f1, ".access( user_id, role_id, site_id ) ",
          "SELECT access.user_id, access.role_id, site1.id ",
          "FROM access ",
          "JOIN site AS site2 ON access.site_id = site2.id ",
          "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = ", @bt_bl_service_id, " ",
          "WHERE site_id IN ( SELECT id FROM site WHERE service_id = ", @bt_f1_service_id, " )" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      IF @cedar_bl IS NOT NULL THEN
        SELECT "Processing access table for cedar sites" AS "";

        SET @sql = CONCAT(
          "CREATE TABLE IF NOT EXISTS ", @cedar_bl, ".access ( ",
            "id INT UNSIGNED NOT NULL AUTO_INCREMENT, ",
            "update_timestamp TIMESTAMP NOT NULL, ",
            "create_timestamp TIMESTAMP NOT NULL, ",
            "user_id INT UNSIGNED NOT NULL, ",
            "role_id INT UNSIGNED NOT NULL, ",
            "site_id INT UNSIGNED NOT NULL, ",
            "datetime DATETIME NULL, ",
            "microtime DOUBLE NULL, ",
            "PRIMARY KEY (id), ",
            "INDEX fk_user_id (user_id ASC), ",
            "INDEX fk_role_id (role_id ASC), ",
            "INDEX fk_site_id (site_id ASC), ",
            "UNIQUE INDEX uq_user_id_role_id_site_id (user_id ASC, role_id ASC, site_id ASC), ",
            "INDEX datetime_microtime (datetime ASC, microtime ASC), ",
            "CONSTRAINT fk_access_user_id ",
              "FOREIGN KEY (user_id) ",
              "REFERENCES ", DATABASE(), ".user (id) ",
              "ON DELETE NO ACTION ",
              "ON UPDATE NO ACTION, ",
            "CONSTRAINT fk_access_role_id ",
              "FOREIGN KEY (role_id) ",
              "REFERENCES ", DATABASE(), ".role (id) ",
              "ON DELETE NO ACTION ",
              "ON UPDATE NO ACTION, ",
            "CONSTRAINT fk_access_site_id ",
              "FOREIGN KEY (site_id) ",
              "REFERENCES ", DATABASE(), ".site (id) ",
              "ON DELETE NO ACTION ",
              "ON UPDATE NO ACTION) ",
          "ENGINE = InnoDB" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT(
          "INSERT IGNORE INTO ", @cedar_bl, ".access( user_id, role_id, site_id ) ",
          "SELECT access.user_id, access.role_id, site1.id ",
          "FROM access ",
          "JOIN site AS site2 ON access.site_id = site2.id ",
          "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = ", @ce_bl_service_id, " ",
          "WHERE site_id IN ( SELECT id FROM site WHERE service_id = ", @ce_bl_service_id, " )" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      IF @cedar_f1 IS NOT NULL THEN
        SELECT "Processing access table for cedar F1 sites" AS "";

        SET @sql = CONCAT(
          "CREATE TABLE IF NOT EXISTS ", @cedar_f1, ".access ( ",
            "id INT UNSIGNED NOT NULL AUTO_INCREMENT, ",
            "update_timestamp TIMESTAMP NOT NULL, ",
            "create_timestamp TIMESTAMP NOT NULL, ",
            "user_id INT UNSIGNED NOT NULL, ",
            "role_id INT UNSIGNED NOT NULL, ",
            "site_id INT UNSIGNED NOT NULL, ",
            "datetime DATETIME NULL, ",
            "microtime DOUBLE NULL, ",
            "PRIMARY KEY (id), ",
            "INDEX fk_user_id (user_id ASC), ",
            "INDEX fk_role_id (role_id ASC), ",
            "INDEX fk_site_id (site_id ASC), ",
            "UNIQUE INDEX uq_user_id_role_id_site_id (user_id ASC, role_id ASC, site_id ASC), ",
            "INDEX datetime_microtime (datetime ASC, microtime ASC), ",
            "CONSTRAINT fk_access_user_id ",
              "FOREIGN KEY (user_id) ",
              "REFERENCES ", DATABASE(), ".user (id) ",
              "ON DELETE NO ACTION ",
              "ON UPDATE NO ACTION, ",
            "CONSTRAINT fk_access_role_id ",
              "FOREIGN KEY (role_id) ",
              "REFERENCES ", DATABASE(), ".role (id) ",
              "ON DELETE NO ACTION ",
              "ON UPDATE NO ACTION, ",
            "CONSTRAINT fk_access_site_id ",
              "FOREIGN KEY (site_id) ",
              "REFERENCES ", DATABASE(), ".site (id) ",
              "ON DELETE NO ACTION ",
              "ON UPDATE NO ACTION) ",
          "ENGINE = InnoDB" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT(
          "INSERT IGNORE INTO ", @cedar_f1, ".access( user_id, role_id, site_id ) ",
          "SELECT access.user_id, access.role_id, site1.id ",
          "FROM access ",
          "JOIN site AS site2 ON access.site_id = site2.id ",
          "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = ", @ce_bl_service_id, " ",
          "WHERE site_id IN ( SELECT id FROM site WHERE service_id = ", @ce_f1_service_id, " )" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      IF @mastodon IS NOT NULL THEN
        SELECT "Processing access table for mastodon F1 sites" AS "";

        SET @sql = CONCAT(
          "CREATE TABLE IF NOT EXISTS ", @mastodon, ".access ( ",
            "id INT UNSIGNED NOT NULL AUTO_INCREMENT, ",
            "update_timestamp TIMESTAMP NOT NULL, ",
            "create_timestamp TIMESTAMP NOT NULL, ",
            "user_id INT UNSIGNED NOT NULL, ",
            "role_id INT UNSIGNED NOT NULL, ",
            "site_id INT UNSIGNED NOT NULL, ",
            "datetime DATETIME NULL, ",
            "microtime DOUBLE NULL, ",
            "PRIMARY KEY (id), ",
            "INDEX fk_user_id (user_id ASC), ",
            "INDEX fk_role_id (role_id ASC), ",
            "INDEX fk_site_id (site_id ASC), ",
            "UNIQUE INDEX uq_user_id_role_id_site_id (user_id ASC, role_id ASC, site_id ASC), ",
            "INDEX datetime_microtime (datetime ASC, microtime ASC), ",
            "CONSTRAINT fk_access_user_id ",
              "FOREIGN KEY (user_id) ",
              "REFERENCES ", DATABASE(), ".user (id) ",
              "ON DELETE NO ACTION ",
              "ON UPDATE NO ACTION, ",
            "CONSTRAINT fk_access_role_id ",
              "FOREIGN KEY (role_id) ",
              "REFERENCES ", DATABASE(), ".role (id) ",
              "ON DELETE NO ACTION ",
              "ON UPDATE NO ACTION, ",
            "CONSTRAINT fk_access_site_id ",
              "FOREIGN KEY (site_id) ",
              "REFERENCES ", DATABASE(), ".site (id) ",
              "ON DELETE NO ACTION ",
              "ON UPDATE NO ACTION) ",
          "ENGINE = InnoDB" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT(
          "INSERT IGNORE INTO ", @mastodon, ".access( user_id, role_id, site_id ) ",
          "SELECT access.user_id, access.role_id, site1.id ",
          "FROM access ",
          "JOIN site AS site2 ON access.site_id = site2.id ",
          "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = ", @ma_service_id, " ",
          "WHERE site_id IN ( SELECT id FROM site WHERE service_id = ", @ma_service_id, " )" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      IF @sabretooth_bl IS NOT NULL THEN
        SELECT "Processing access table for sabretooth sites" AS "";

        SET @sql = CONCAT(
          "CREATE TABLE IF NOT EXISTS ", @sabretooth_bl, ".access ( ",
            "id INT UNSIGNED NOT NULL AUTO_INCREMENT, ",
            "update_timestamp TIMESTAMP NOT NULL, ",
            "create_timestamp TIMESTAMP NOT NULL, ",
            "user_id INT UNSIGNED NOT NULL, ",
            "role_id INT UNSIGNED NOT NULL, ",
            "site_id INT UNSIGNED NOT NULL, ",
            "datetime DATETIME NULL, ",
            "microtime DOUBLE NULL, ",
            "PRIMARY KEY (id), ",
            "INDEX fk_user_id (user_id ASC), ",
            "INDEX fk_role_id (role_id ASC), ",
            "INDEX fk_site_id (site_id ASC), ",
            "UNIQUE INDEX uq_user_id_role_id_site_id (user_id ASC, role_id ASC, site_id ASC), ",
            "INDEX datetime_microtime (datetime ASC, microtime ASC), ",
            "CONSTRAINT fk_access_user_id ",
              "FOREIGN KEY (user_id) ",
              "REFERENCES ", DATABASE(), ".user (id) ",
              "ON DELETE NO ACTION ",
              "ON UPDATE NO ACTION, ",
            "CONSTRAINT fk_access_role_id ",
              "FOREIGN KEY (role_id) ",
              "REFERENCES ", DATABASE(), ".role (id) ",
              "ON DELETE NO ACTION ",
              "ON UPDATE NO ACTION, ",
            "CONSTRAINT fk_access_site_id ",
              "FOREIGN KEY (site_id) ",
              "REFERENCES ", DATABASE(), ".site (id) ",
              "ON DELETE NO ACTION ",
              "ON UPDATE NO ACTION) ",
          "ENGINE = InnoDB" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT(
          "INSERT IGNORE INTO ", @sabretooth_bl, ".access( user_id, role_id, site_id ) ",
          "SELECT access.user_id, access.role_id, site1.id ",
          "FROM access ",
          "JOIN site AS site2 ON access.site_id = site2.id ",
          "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = ", @st_bl_service_id, " ",
          "WHERE site_id IN ( SELECT id FROM site WHERE service_id = ", @st_bl_service_id, " )" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      IF @sabretooth_mc IS NOT NULL THEN
        SELECT "Processing access table for sabretooth MC sites" AS "";

        SET @sql = CONCAT(
          "CREATE TABLE IF NOT EXISTS ", @sabretooth_mc, ".access ( ",
            "id INT UNSIGNED NOT NULL AUTO_INCREMENT, ",
            "update_timestamp TIMESTAMP NOT NULL, ",
            "create_timestamp TIMESTAMP NOT NULL, ",
            "user_id INT UNSIGNED NOT NULL, ",
            "role_id INT UNSIGNED NOT NULL, ",
            "site_id INT UNSIGNED NOT NULL, ",
            "datetime DATETIME NULL, ",
            "microtime DOUBLE NULL, ",
            "PRIMARY KEY (id), ",
            "INDEX fk_user_id (user_id ASC), ",
            "INDEX fk_role_id (role_id ASC), ",
            "INDEX fk_site_id (site_id ASC), ",
            "UNIQUE INDEX uq_user_id_role_id_site_id (user_id ASC, role_id ASC, site_id ASC), ",
            "INDEX datetime_microtime (datetime ASC, microtime ASC), ",
            "CONSTRAINT fk_access_user_id ",
              "FOREIGN KEY (user_id) ",
              "REFERENCES ", DATABASE(), ".user (id) ",
              "ON DELETE NO ACTION ",
              "ON UPDATE NO ACTION, ",
            "CONSTRAINT fk_access_role_id ",
              "FOREIGN KEY (role_id) ",
              "REFERENCES ", DATABASE(), ".role (id) ",
              "ON DELETE NO ACTION ",
              "ON UPDATE NO ACTION, ",
            "CONSTRAINT fk_access_site_id ",
              "FOREIGN KEY (site_id) ",
              "REFERENCES ", DATABASE(), ".site (id) ",
              "ON DELETE NO ACTION ",
              "ON UPDATE NO ACTION) ",
          "ENGINE = InnoDB" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT(
          "INSERT IGNORE INTO ", @sabretooth_mc, ".access( user_id, role_id, site_id ) ",
          "SELECT access.user_id, access.role_id, IFNULL( site1.id, site2.id ) ",
          "FROM access ",
          "JOIN site AS site2 ON access.site_id = site2.id ",
          "LEFT JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = ", @st_bl_service_id, " ",
          "WHERE site_id IN ( SELECT id FROM site WHERE service_id = ", @st_mc_service_id, " )" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      IF @sabretooth_f1 IS NOT NULL THEN
        SELECT "Processing access table for sabretooth F1 sites" AS "";

        SET @sql = CONCAT(
          "CREATE TABLE IF NOT EXISTS ", @sabretooth_f1, ".access ( ",
            "id INT UNSIGNED NOT NULL AUTO_INCREMENT, ",
            "update_timestamp TIMESTAMP NOT NULL, ",
            "create_timestamp TIMESTAMP NOT NULL, ",
            "user_id INT UNSIGNED NOT NULL, ",
            "role_id INT UNSIGNED NOT NULL, ",
            "site_id INT UNSIGNED NOT NULL, ",
            "datetime DATETIME NULL, ",
            "microtime DOUBLE NULL, ",
            "PRIMARY KEY (id), ",
            "INDEX fk_user_id (user_id ASC), ",
            "INDEX fk_role_id (role_id ASC), ",
            "INDEX fk_site_id (site_id ASC), ",
            "UNIQUE INDEX uq_user_id_role_id_site_id (user_id ASC, role_id ASC, site_id ASC), ",
            "INDEX datetime_microtime (datetime ASC, microtime ASC), ",
            "CONSTRAINT fk_access_user_id ",
              "FOREIGN KEY (user_id) ",
              "REFERENCES ", DATABASE(), ".user (id) ",
              "ON DELETE NO ACTION ",
              "ON UPDATE NO ACTION, ",
            "CONSTRAINT fk_access_role_id ",
              "FOREIGN KEY (role_id) ",
              "REFERENCES ", DATABASE(), ".role (id) ",
              "ON DELETE NO ACTION ",
              "ON UPDATE NO ACTION, ",
            "CONSTRAINT fk_access_site_id ",
              "FOREIGN KEY (site_id) ",
              "REFERENCES ", DATABASE(), ".site (id) ",
              "ON DELETE NO ACTION ",
              "ON UPDATE NO ACTION) ",
          "ENGINE = InnoDB" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT(
          "INSERT IGNORE INTO ", @sabretooth_f1, ".access( user_id, role_id, site_id ) ",
          "SELECT access.user_id, access.role_id, IFNULL( site1.id, IFNULL( site2.id, site3.id ) ) ",
          "FROM access ",
          "JOIN site AS site3 ON access.site_id = site3.id ",
          "LEFT JOIN site AS site1 ON site1.name = site3.name AND site1.service_id = ", @st_bl_service_id, " ",
          "LEFT JOIN site AS site2 ON site2.name = site3.name AND site2.service_id = ", @st_mc_service_id, " ",
          "WHERE site_id IN ( SELECT id FROM site WHERE service_id = ", @st_f1_service_id, " )" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      IF @sabretooth_qc IS NOT NULL THEN
        SELECT "Processing access table for sabretooth QC sites" AS "";

        SET @sql = CONCAT(
          "CREATE TABLE IF NOT EXISTS ", @sabretooth_qc, ".access ( ",
            "id INT UNSIGNED NOT NULL AUTO_INCREMENT, ",
            "update_timestamp TIMESTAMP NOT NULL, ",
            "create_timestamp TIMESTAMP NOT NULL, ",
            "user_id INT UNSIGNED NOT NULL, ",
            "role_id INT UNSIGNED NOT NULL, ",
            "site_id INT UNSIGNED NOT NULL, ",
            "datetime DATETIME NULL, ",
            "microtime DOUBLE NULL, ",
            "PRIMARY KEY (id), ",
            "INDEX fk_user_id (user_id ASC), ",
            "INDEX fk_role_id (role_id ASC), ",
            "INDEX fk_site_id (site_id ASC), ",
            "UNIQUE INDEX uq_user_id_role_id_site_id (user_id ASC, role_id ASC, site_id ASC), ",
            "INDEX datetime_microtime (datetime ASC, microtime ASC), ",
            "CONSTRAINT fk_access_user_id ",
              "FOREIGN KEY (user_id) ",
              "REFERENCES ", DATABASE(), ".user (id) ",
              "ON DELETE NO ACTION ",
              "ON UPDATE NO ACTION, ",
            "CONSTRAINT fk_access_role_id ",
              "FOREIGN KEY (role_id) ",
              "REFERENCES ", DATABASE(), ".role (id) ",
              "ON DELETE NO ACTION ",
              "ON UPDATE NO ACTION, ",
            "CONSTRAINT fk_access_site_id ",
              "FOREIGN KEY (site_id) ",
              "REFERENCES ", DATABASE(), ".site (id) ",
              "ON DELETE NO ACTION ",
              "ON UPDATE NO ACTION) ",
          "ENGINE = InnoDB" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;

        SET @sql = CONCAT(
          "INSERT IGNORE INTO ", @sabretooth_qc, ".access( user_id, role_id, site_id ) ",
          "SELECT access.user_id, access.role_id, IFNULL( site1.id, site2.id ) ",
          "FROM access ",
          "JOIN site AS site2 ON access.site_id = site2.id ",
          "LEFT JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = ", @st_bl_service_id, " ",
          "WHERE site_id IN ( SELECT id FROM site WHERE service_id = ", @st_qc_service_id, " )" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      SELECT "Deleting old access records" AS "";
      TRUNCATE access; 

      -- -------------------------------------------------------------------------------------------
      IF @bt_bl_service_id IS NOT NULL AND @bt_f1_service_id IS NOT NULL THEN
        SET @test = (
          SELECT COUNT(*) FROM jurisdiction WHERE site_id IN (
            SELECT id FROM site WHERE service_id = @bt_f1_service_id
          )
        );
        IF @test > 0 THEN
          SELECT "Processing jurisdiction table for beartooth sites" AS "";
          UPDATE jurisdiction
          JOIN site AS site2 ON site_id = site2.id
          JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @bt_bl_service_id
          SET site_id = site1.id
          WHERE site_id IN ( SELECT id FROM site WHERE service_id = @bt_f1_service_id );

          -- now remove duplicates
          DROP TABLE IF EXISTS temp;
          CREATE TEMPORARY TABLE temp
          SELECT * FROM jurisdiction
          GROUP BY site_id, postcode
          HAVING COUNT(*) > 1
          ORDER BY id;
          INSERT INTO temp
          SELECT * FROM jurisdiction
          GROUP BY site_id, postcode
          HAVING COUNT(*) = 1
          ORDER BY id;

          TRUNCATE jurisdiction;
          INSERT INTO jurisdiction SELECT * FROM temp ORDER BY id;
        END IF;
      END IF;

      -- -------------------------------------------------------------------------------------------
      SELECT "Removing defunct region_sites" AS "";
      DELETE FROM region_site
      WHERE site_id IN(
        SELECT site.id FROM site
        JOIN service ON site.service_id = service.id
        WHERE release_based = false
      );

      IF @st_bl_service_id IS NOT NULL AND @st_mc_service_id IS NOT NULL THEN
        SET @test = (
          SELECT COUNT(*) FROM region_site WHERE site_id IN (
            SELECT id FROM site WHERE service_id = @st_mc_service_id AND name != "Simon Fraser"
          )
        );
        IF @test > 0 THEN
          SELECT "Processing region_site table for sabretooth MC and F1 sites" AS "";
          UPDATE region_site
          JOIN site AS site2 ON site_id = site2.id
          JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_bl_service_id
          SET site_id = site1.id
          WHERE site_id IN ( SELECT id FROM site WHERE service_id = @st_mc_service_id );

          UPDATE region_site
          JOIN site AS site2 ON site_id = site2.id
          JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_bl_service_id
          SET site_id = site1.id
          WHERE site_id IN ( SELECT id FROM site WHERE service_id = @st_f1_service_id );

          -- for simon fraser which is in MC
          UPDATE region_site
          JOIN site AS site2 ON site_id = site2.id
          JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_mc_service_id
          SET site_id = site1.id
          WHERE site_id IN ( SELECT id FROM site WHERE service_id = @st_f1_service_id );

          -- now remove duplicates
          DROP TABLE IF EXISTS temp;
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
      IF @bt_bl_service_id IS NOT NULL AND @bt_f1_service_id IS NOT NULL THEN
        SELECT "Removing beartooth F1 quotas" AS "";
        DELETE FROM quota WHERE site_id IN (
          SELECT id FROM site WHERE service_id = @bt_f1_service_id
        );
      END IF;

      IF @st_bl_service_id IS NOT NULL AND @st_mc_service_id IS NOT NULL THEN
        SELECT "Removing sabretooth MC quotas" AS "";
        DELETE FROM quota WHERE site_id IN (
          SELECT id FROM site WHERE service_id = @st_mc_service_id AND name != "Simon Fraser"
        );
      END IF;

      IF @st_bl_service_id IS NOT NULL AND @st_f1_service_id IS NOT NULL THEN
        SELECT "Removing sabretooth F1 quotas" AS "";
        DELETE FROM quota WHERE site_id IN (
          SELECT id FROM site WHERE service_id = @st_f1_service_id
        );
      END IF;

      -- -------------------------------------------------------------------------------------------
      IF @bt_bl_service_id IS NOT NULL AND @bt_f1_service_id IS NOT NULL THEN
        SELECT "Processing service_has_participant table for beartooth F1 sites" AS "";
        UPDATE service_has_participant
        JOIN site AS site2 ON preferred_site_id = site2.id
        JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @bt_bl_service_id
        SET preferred_site_id = site1.id
        WHERE preferred_site_id IN ( SELECT id FROM site WHERE service_id = @bt_f1_service_id );
      END IF;

      IF @st_bl_service_id IS NOT NULL AND @st_mc_service_id IS NOT NULL THEN
        SELECT "Processing service_has_participant table for sabretooth MC sites" AS "";
        UPDATE service_has_participant
        JOIN site AS site2 ON preferred_site_id = site2.id
        JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_bl_service_id
        SET preferred_site_id = site1.id
        WHERE preferred_site_id IN ( SELECT id FROM site WHERE service_id = @st_mc_service_id );
      END IF;

      IF @st_bl_service_id IS NOT NULL AND @st_f1_service_id IS NOT NULL THEN
        SELECT "Processing service_has_participant table for sabretooth F1 sites" AS "";
        UPDATE service_has_participant
        JOIN site AS site2 ON preferred_site_id = site2.id
        JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_bl_service_id
        SET preferred_site_id = site1.id
        WHERE preferred_site_id IN ( SELECT id FROM site WHERE service_id = @st_f1_service_id );
      END IF;

      -- for simon fraser which is in MC
      IF @st_bl_service_id IS NOT NULL AND @st_f1_service_id IS NOT NULL THEN
        SELECT "Processing service_has_participant table for sabretooth F1 sites" AS "";
        UPDATE service_has_participant
        JOIN site AS site2 ON preferred_site_id = site2.id
        JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_mc_service_id
        SET preferred_site_id = site1.id
        WHERE preferred_site_id IN ( SELECT id FROM site WHERE service_id = @st_f1_service_id );
      END IF;

      -- -------------------------------------------------------------------------------------------
      -- Now we convert sites in Beartooth databases
      -- -------------------------------------------------------------------------------------------

      -- TODO

      -- -------------------------------------------------------------------------------------------
      -- Now we convert sites in non-baseline Sabretooth databases
      -- -------------------------------------------------------------------------------------------
      SELECT "Converting assignment sites for MC" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_mc, ".assignment ",
        "JOIN site AS site2 ON assignment.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_bl_service_id ",
        "SET assignment.site_id = site1.id ",
        "WHERE site2.service_id = @st_mc_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Converting shift sites for MC" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_mc, ".shift ",
        "JOIN site AS site2 ON shift.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_bl_service_id ",
        "SET shift.site_id = site1.id ",
        "WHERE site2.service_id = @st_mc_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Converting shift_template sites for MC" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_mc, ".shift_template ",
        "JOIN site AS site2 ON shift_template.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_bl_service_id ",
        "SET shift_template.site_id = site1.id ",
        "WHERE site2.service_id = @st_mc_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Converting queue_has_participant sites for MC" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_mc, ".queue_has_participant ",
        "JOIN site AS site2 ON queue_has_participant.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_bl_service_id ",
        "SET queue_has_participant.site_id = site1.id ",
        "WHERE site2.service_id = @st_mc_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Converting queue_state sites for MC" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_mc, ".queue_state ",
        "JOIN site AS site2 ON queue_state.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_bl_service_id ",
        "SET queue_state.site_id = site1.id ",
        "WHERE site2.service_id = @st_mc_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Replacing MC sites in setting_values" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_mc, ".setting_value ",
        "JOIN site AS site2 ON site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_bl_service_id ",
        "SET site_id = site1.id ",
        "WHERE site2.service_id = @st_mc_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Replacing MC sites in system_messages" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_mc, ".system_message ",
        "JOIN site AS site2 ON site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_bl_service_id ",
        "SET site_id = site1.id ",
        "WHERE site2.service_id = @st_mc_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Converting assignment sites for F1" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_f1, ".assignment ",
        "JOIN site AS site2 ON assignment.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_bl_service_id ",
        "SET assignment.site_id = site1.id ",
        "WHERE site2.service_id = @st_f1_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- for simon fraser which is in MC
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_f1, ".assignment ",
        "JOIN site AS site2 ON assignment.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_mc_service_id ",
        "SET assignment.site_id = site1.id ",
        "WHERE site2.service_id = @st_f1_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Converting shift sites for F1" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_f1, ".shift ",
        "JOIN site AS site2 ON shift.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_bl_service_id ",
        "SET shift.site_id = site1.id ",
        "WHERE site2.service_id = @st_f1_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- for simon fraser which is in MC
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_f1, ".shift ",
        "JOIN site AS site2 ON shift.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_mc_service_id ",
        "SET shift.site_id = site1.id ",
        "WHERE site2.service_id = @st_f1_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Converting shift_template sites for F1" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_f1, ".shift_template ",
        "JOIN site AS site2 ON shift_template.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_bl_service_id ",
        "SET shift_template.site_id = site1.id ",
        "WHERE site2.service_id = @st_f1_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- for simon fraser which is in MC
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_f1, ".shift_template ",
        "JOIN site AS site2 ON shift_template.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_mc_service_id ",
        "SET shift_template.site_id = site1.id ",
        "WHERE site2.service_id = @st_f1_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Converting queue_has_participant sites for F1" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_f1, ".queue_has_participant ",
        "JOIN site AS site2 ON queue_has_participant.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_bl_service_id ",
        "SET queue_has_participant.site_id = site1.id ",
        "WHERE site2.service_id = @st_f1_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- for simon fraser which is in MC
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_f1, ".queue_has_participant ",
        "JOIN site AS site2 ON queue_has_participant.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_mc_service_id ",
        "SET queue_has_participant.site_id = site1.id ",
        "WHERE site2.service_id = @st_f1_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Converting queue_state sites for F1" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_f1, ".queue_state ",
        "JOIN site AS site2 ON queue_state.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_bl_service_id ",
        "SET queue_state.site_id = site1.id ",
        "WHERE site2.service_id = @st_f1_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- for simon fraser which is in MC
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_f1, ".queue_state ",
        "JOIN site AS site2 ON queue_state.site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_mc_service_id ",
        "SET queue_state.site_id = site1.id ",
        "WHERE site2.service_id = @st_f1_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Replacing F1 sites in setting_values" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_f1, ".setting_value ",
        "JOIN site AS site2 ON site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_bl_service_id ",
        "SET site_id = site1.id ",
        "WHERE site2.service_id = @st_f1_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- for simon fraser which is in MC
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_f1, ".setting_value ",
        "JOIN site AS site2 ON site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_mc_service_id ",
        "SET site_id = site1.id ",
        "WHERE site2.service_id = @st_f1_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      SELECT "Replacing F1 sites in system_messages" AS "";
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_f1, ".system_message ",
        "JOIN site AS site2 ON site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_bl_service_id ",
        "SET site_id = site1.id ",
        "WHERE site2.service_id = @st_f1_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- for simon fraser which is in MC
      SET @sql = CONCAT(
        "UPDATE ", @sabretooth_f1, ".system_message ",
        "JOIN site AS site2 ON site_id = site2.id ",
        "JOIN site AS site1 ON site1.name = site2.name AND site1.service_id = @st_mc_service_id ",
        "SET site_id = site1.id ",
        "WHERE site2.service_id = @st_f1_service_id " );
      PREPARE statement FROM @sql;
      EXECUTE statement;
      DEALLOCATE PREPARE statement;

      -- -------------------------------------------------------------------------------------------
      -- Finally, we delete the old sites
      -- -------------------------------------------------------------------------------------------
      IF @bt_bl_service_id IS NOT NULL AND @bt_f1_service_id IS NOT NULL THEN
        SELECT "Removing beartooth F1 sites" AS "";
        SET @sql = CONCAT( "DELETE FROM site WHERE service_id = @bt_f1_service_id" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      IF @st_bl_service_id IS NOT NULL AND @st_mc_service_id IS NOT NULL THEN
        SELECT "Removing sabretooth MC sites" AS "";
        SET @sql = CONCAT( "DELETE FROM site WHERE service_id = @st_mc_service_id AND name != 'Simon Fraser'" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

      IF @st_bl_service_id IS NOT NULL AND @st_f1_service_id IS NOT NULL THEN
        SELECT "Removing sabretooth F1 sites" AS "";
        SET @sql = CONCAT( "DELETE FROM site WHERE service_id = @st_f1_service_id" );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
      END IF;

    END IF;

  END //
DELIMITER ;

CALL clsa_pre_update();
DROP PROCEDURE IF EXISTS clsa_pre_update;
