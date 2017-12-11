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
      ( "requires initiation", "The proxy initiation script must be completed before the participant can proceed using a proxy." ),
      ( "requires form", "A signed proxy consent form must be provided before the participant can proceed using a proxy." ),
      ( "ready", "The participant may proceed using a proxy." ),
      ( "ready, information provider only", "The participant may proceed using a proxy information provider only." );

    END IF;

  END //
DELIMITER ;

CALL patch_proxy_type();
DROP PROCEDURE IF EXISTS patch_proxy_type;
