DROP PROCEDURE IF EXISTS patch_proxy_type;
DELIMITER //
CREATE PROCEDURE patch_proxy_type()
  BEGIN

    SET @test = ( 
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "proxy_type" );
    IF @test = 0 THEN

      SELECT "Creating new proxy_type table" AS "";

      CREATE TABLE IF NOT EXISTS proxy_type (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        update_timestamp TIMESTAMP NOT NULL,
        create_timestamp TIMESTAMP NOT NULL,
        name VARCHAR(100) NOT NULL,
        description VARCHAR(512) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE INDEX uq_name (name ASC))
      ENGINE = InnoDB;
      
      INSERT INTO proxy_type( name, description ) VALUES
      ( "contact required, central", "Follow-up is required to determine how the participant will move forward through the proxy process." ),
      ( "consent form required", "A signed proxy consent form must be provided before the participant can proceed using a proxy." ),
      ( "initiated", "The participant has chosen to use a full proxy." ),
      ( "initiated, information provider only", "The participant has chosen to use an information provider only." );

    END IF;

  END //
DELIMITER ;

CALL patch_proxy_type();
DROP PROCEDURE IF EXISTS patch_proxy_type;
