DROP PROCEDURE IF EXISTS patch_trace_type;
DELIMITER //
CREATE PROCEDURE patch_trace_type()
  BEGIN

    SET @test = ( 
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "trace_type" );
    IF @test = 0 THEN

      SELECT "Creating new trace_type table" AS "";

      CREATE TABLE IF NOT EXISTS trace_type (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        update_timestamp TIMESTAMP NOT NULL,
        create_timestamp TIMESTAMP NOT NULL,
        name VARCHAR(100) NOT NULL,
        description VARCHAR(512) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE INDEX uq_name (name ASC))
      ENGINE = InnoDB;
      
      INSERT INTO trace_type( name, description ) VALUES
      ( "local", "People who are being traced by the local site." ),
      ( "global", "People who are being traced by the head office." ),
      ( "unreachable", "People who failed to be traced." );

    END IF;

  END //
DELIMITER ;

CALL patch_trace_type();
DROP PROCEDURE IF EXISTS patch_trace_type;
