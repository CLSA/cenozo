DROP PROCEDURE IF EXISTS patch_study;
DELIMITER //
CREATE PROCEDURE patch_study()
  BEGIN

    SELECT code INTO @test
    FROM study_phase
    WHERE code RLIKE "[a-z]1";

    IF "f1" = @test THEN
      INSERT IGNORE INTO study( name ) VALUES
      ( "CLSA" ),
      ( "COVID-19 Questionnaire" ),
      ( "COVID-19 Antibody" ),
      ( "COVID-19 Dried Blood Spot" ),
      ( "COVID-19 Brain" );
    ELSEIF "b1" = @test THEN
      INSERT IGNORE INTO study( name ) VALUES
      ( "Back Pain" );
    END IF;

  END //
DELIMITER ;

SELECT "Creating new study table" AS "";

CREATE TABLE IF NOT EXISTS study (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  name VARCHAR(45) NOT NULL,
  consent_type_id INT UNSIGNED NULL DEFAULT NULL,
  description TEXT NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_name (name ASC),
  INDEX fk_consent_type_id (consent_type_id ASC),
  CONSTRAINT fk_study_consent_type_id
    FOREIGN KEY (consent_type_id)
    REFERENCES consent_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CALL patch_study();
DROP PROCEDURE IF EXISTS patch_study;
