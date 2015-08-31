DROP PROCEDURE IF EXISTS patch_phase;
  DELIMITER //
  CREATE PROCEDURE patch_phase()
  BEGIN

    -- determine the @cenozo database name
    SET @cenozo = (
      SELECT unique_constraint_schema
      FROM information_schema.referential_constraints
      WHERE constraint_schema = DATABASE()
      AND constraint_name = "fk_queue_state_site_id" );

    SELECT "Creating new phase table" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "phase" );
    IF @test = 0 THEN
      DROP TABLE IF EXISTS phase;

      CREATE TABLE IF NOT EXISTS phase (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        update_timestamp TIMESTAMP NOT NULL,
        create_timestamp TIMESTAMP NOT NULL,
        script_id INT UNSIGNED NOT NULL,
        rank SMALLINT UNSIGNED NOT NULL,
        sid INT NOT NULL,
        repeated TINYINT(1) NOT NULL DEFAULT 0,
        PRIMARY KEY (id),
        INDEX fk_script_id (script_id ASC),
        CONSTRAINT fk_phase_script_id
          FOREIGN KEY (script_id)
          REFERENCES script (id)
          ON DELETE CASCADE
          ON UPDATE NO ACTION)
      ENGINE = InnoDB;
    END IF;

  END //
DELIMITER ;

-- now call the procedure and remove the procedure
CALL patch_phase();
DROP PROCEDURE IF EXISTS patch_phase;
