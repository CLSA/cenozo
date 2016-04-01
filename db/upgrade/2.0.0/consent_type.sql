CREATE TABLE IF NOT EXISTS consent_type (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_name (name ASC))
ENGINE = InnoDB;

INSERT IGNORE INTO consent_type( name, description ) VALUES
( "participation", "Consent to participate in the study." ),
( "draw blood", "Consent to draw blood." ),
( "take urine", "Consent to take urine." ),
( "use proxy", "Consent to use a proxy decision maker to make desisions on behalf of the participant." ),
( "use informant", "Consent to use an information provider to provide information on behalf of the participant." ),
( "HIN access", "Consent to grant CLSA access to the participant's health insurance number." ),
( "HIN future access", "Consent to grant CLSA future linkage access to the participant's health insurance number in the event that they use a proxy decision maker." );

SELECT "Adding new triggers to consent_type table" AS "";

DELIMITER $$

DROP TRIGGER IF EXISTS consent_type_AFTER_INSERT $$
CREATE DEFINER = CURRENT_USER TRIGGER consent_type_AFTER_INSERT AFTER INSERT ON consent_type FOR EACH ROW
BEGIN
  INSERT INTO participant_last_consent( participant_id, consent_type_id, consent_id )
  SELECT participant.id, NEW.id, NULL 
  FROM participant;
  INSERT INTO participant_last_written_consent( participant_id, consent_type_id, consent_id )
  SELECT participant.id, NEW.id, NULL 
  FROM participant;
END;$$

DELIMITER ;
