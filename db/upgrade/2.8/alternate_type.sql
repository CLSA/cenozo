DROP PROCEDURE IF EXISTS patch_alternate_type;
DELIMITER //
CREATE PROCEDURE patch_alternate_type()
  BEGIN

    SELECT COUNT(*) INTO @test
    FROM information_schema.TABLES
    WHERE table_schema = DATABASE()
    AND table_name = "alternate_type";

    IF 0 = @test THEN

      SELECT "Creating new alternate_type table" AS "";

      CREATE TABLE IF NOT EXISTS alternate_type (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        update_timestamp TIMESTAMP NOT NULL,
        create_timestamp TIMESTAMP NOT NULL,
        name VARCHAR(45) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        PRIMARY KEY (id),
        UNIQUE INDEX uq_name (name ASC),
        UNIQUE INDEX uq_title (title ASC))
      ENGINE = InnoDB;

      INSERT INTO alternate_type( name, title, description ) VALUES
      ( "informant", "Information Provider", "A person who can answer question on behalf of the participant." ),
      ( "proxy", "Decision Maker", "A person who can make decisions on the participant's behalf about participating in the study." ),
      ( "decedent", "Decedent Responder", "A person who can answer questions about the details of a participant's death." ),
      ( "emergency", "Emergency Contact", "A person to contact in the event of an emergency involving the participant." );

    END IF;

  END //
DELIMITER ;

CALL patch_alternate_type();
DROP PROCEDURE IF EXISTS patch_alternate_type;
