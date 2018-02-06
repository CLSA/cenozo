DROP PROCEDURE IF EXISTS patch_hold_type;
DELIMITER //
CREATE PROCEDURE patch_hold_type()
  BEGIN

    SET @test = ( 
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "hold_type" );
    IF @test = 0 THEN

      SELECT "Creating new hold_type table" AS "";

      CREATE TABLE IF NOT EXISTS hold_type (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        update_timestamp TIMESTAMP NOT NULL,
        create_timestamp TIMESTAMP NOT NULL,
        type ENUM('final', 'temporary') NOT NULL,
        name VARCHAR(100) NOT NULL,
        system TINYINT(1) NOT NULL DEFAULT 0,
        description VARCHAR(512) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE INDEX uq_type_name (type ASC, name ASC))
      ENGINE = InnoDB;
      
      -- final holds
      INSERT INTO hold_type( type, name, system, description ) VALUES
      ( "final", "Deceased", 0, "People who are deceased." ),
      ( "final", "Duplicate", 0, "People who already exist under a different record." ),
      ( "final", "Incarcerated", 0, "People who are incarcerated indefinitely." ),
      ( "final", "Noncompliant", 0, "People who are unable to comply with the study's policies." ),
      ( "final", "Withdrawn", 1, "People who have withdrawn from the study." );

      -- temporary holds (all remaining states not already defined
      CREATE TEMPORARY TABLE temp_hold_type (
        name VARCHAR(100) NOT NULL,
        INDEX dk_name( name )
      ) SELECT name FROM hold_type;

      INSERT INTO hold_type( type, name, system, description )
      SELECT "temporary", name, 0, description
      FROM state
      JOIN participant ON state.id = participant.state_id
      WHERE name NOT IN ( SELECT name FROM temp_hold_type )
      AND name NOT IN ( 'local', 'global', 'unreachable' ) -- don't include trace types
      AND name NOT LIKE ( 'ready%' ) -- don't include proxy types
      AND name NOT LIKE ( 'requires%' ) -- don't include proxy types
      GROUP BY state.name;

    END IF;

  END //
DELIMITER ;

CALL patch_hold_type();
DROP PROCEDURE IF EXISTS patch_hold_type;
