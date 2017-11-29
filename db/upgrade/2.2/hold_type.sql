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
        type ENUM('final', 'proxy', 'temporary', 'trace') NOT NULL,
        name VARCHAR(100) NOT NULL,
        system TINYINT(1) NOT NULL DEFAULT 0,
        description VARCHAR(512) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE INDEX uq_type_name (type ASC, name ASC))
      ENGINE = InnoDB;
      
      -- final holds
      INSERT INTO hold_type( type, name, system, description ) VALUES
      ( "final", "deceased", 0, "People who are deceased." ),
      ( "final", "duplicate", 0, "People who already exist under a different record." ),
      ( "final", "incarcerated", 0, "People who are incarcerated indefinitely." ),
      ( "final", "noncompliant", 0, "People who are unable to comply with the study's policies." ),
      ( "final", "withdrawn", 1, "People who have withdrawn from the study." );

      -- proxy holds
      INSERT INTO hold_type( type, name, system, description ) VALUES
      ( "proxy", "requires initiation", 0, "The proxy initiation script must be completed before the participant can proceed using a proxy." ),
      ( "proxy", "requires form", 0, "A signed proxy consent form must be provided before the participant can proceed using a proxy." ),
      ( "proxy", "ready", 0, "The participant may proceed using a proxy." ),
      ( "proxy", "ready, information provider only", 0, "The participant may proceed using a proxy information provider only." );

      -- trace holds
      INSERT INTO hold_type( type, name, system, description ) VALUES
      ( "trace", "local", 1, "People who are being traced by the local site." ),
      ( "trace", "global", 1, "People who are being traced by the head office." ),
      ( "trace", "unreachable", 1, "People who failed to be traced." );

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
      GROUP BY state.name;

      INSERT INTO hold_type( type, name, system, description )
      VALUES ( "temporary", "deactivated", 0, "The participant was deactivated for an unknown reason." );

    END IF;

  END //
DELIMITER ;

CALL patch_hold_type();
DROP PROCEDURE IF EXISTS patch_hold_type;
