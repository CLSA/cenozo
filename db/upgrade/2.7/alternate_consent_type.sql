DROP PROCEDURE IF EXISTS patch_alternate_consent_type;
DELIMITER //
CREATE PROCEDURE patch_alternate_consent_type()
  BEGIN

    SELECT COUNT(*) INTO @test
    FROM information_schema.TABLES
    WHERE table_schema = DATABASE()
    AND table_name = "alternate";

    IF 0 < @test THEN

      SELECT "Creating new alternate_consent_type table" AS "";

      CREATE TABLE IF NOT EXISTS alternate_consent_type (
        id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
        update_timestamp TIMESTAMP NOT NULL,
        create_timestamp TIMESTAMP NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT NULL DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE INDEX uq_name (name ASC))
      ENGINE = InnoDB;

      INSERT IGNORE INTO alternate_consent_type( name, description )
      SELECT name, description FROM consent_type WHERE name IN ( 'decision maker', 'information provider' );

    END IF;

  END //
DELIMITER ;

CALL patch_alternate_consent_type();
DROP PROCEDURE IF EXISTS patch_alternate_consent_type;
