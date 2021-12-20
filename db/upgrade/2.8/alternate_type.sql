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
        alternate_consent_type_id INT(10) UNSIGNED NULL DEFAULT NULL, 
        description TEXT NULL, 
        PRIMARY KEY (id), 
        UNIQUE INDEX uq_name (name ASC), 
        UNIQUE INDEX uq_title (title ASC), 
        INDEX fk_alternate_consent_type_id (alternate_consent_type_id ASC), 
        CONSTRAINT fk_alternate_type_alternate_consent_type_id 
          FOREIGN KEY (alternate_consent_type_id) 
          REFERENCES alternate_consent_type (id) 
          ON DELETE SET NULL 
          ON UPDATE NO ACTION 
      ) ENGINE = InnoDB;

      INSERT INTO alternate_type( name, title, description ) VALUES
      ( "informant", "Information Provider", "A person who can answer question on behalf of the participant." ),
      ( "proxy", "Decision Maker", "A person who can make decisions on the participant's behalf about participating in the study." ),
      ( "decedent", "Decedent Responder", "A person who can answer questions about the details of a participant's death." ),
      ( "emergency", "Emergency Contact", "A person to contact in the event of an emergency involving the participant." );

      UPDATE alternate_type
      JOIN alternate_consent_type ON alternate_type.title = alternate_consent_type.name
      SET alternate_type.alternate_consent_type_id = alternate_consent_type.id;

    END IF;

  END //
DELIMITER ;

CALL patch_alternate_type();
DROP PROCEDURE IF EXISTS patch_alternate_type;
