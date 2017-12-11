DROP PROCEDURE IF EXISTS patch_hold;
DELIMITER //
CREATE PROCEDURE patch_hold()
  BEGIN

    SET @test = ( 
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "hold" );
    IF @test = 0 THEN

      SELECT "Creating new hold table" AS "";

      CREATE TABLE IF NOT EXISTS hold (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        update_timestamp TIMESTAMP NOT NULL,
        create_timestamp TIMESTAMP NOT NULL,
        participant_id INT UNSIGNED NOT NULL,
        hold_type_id INT UNSIGNED NULL,
        datetime DATETIME NOT NULL,
        user_id INT UNSIGNED NULL,
        site_id INT UNSIGNED NULL,
        role_id INT UNSIGNED NULL,
        application_id INT UNSIGNED NULL,
        note TEXT NULL,
        PRIMARY KEY (id),
        INDEX fk_participant_id (participant_id ASC),
        INDEX fk_hold_type_id (hold_type_id ASC),
        INDEX fk_user_id (user_id ASC),
        INDEX fk_site_id (site_id ASC),
        INDEX fk_role_id (role_id ASC),
        INDEX fk_application_id (application_id ASC),
        UNIQUE INDEX uq_participant_id_datetime (participant_id ASC, datetime ASC),
        CONSTRAINT fk_hold_participant_id
          FOREIGN KEY (participant_id)
          REFERENCES participant (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION,
        CONSTRAINT fk_hold_hold_type_id
          FOREIGN KEY (hold_type_id)
          REFERENCES hold_type (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION,
        CONSTRAINT fk_hold_user_id
          FOREIGN KEY (user_id)
          REFERENCES user (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION,
        CONSTRAINT fk_hold_site_id
          FOREIGN KEY (site_id)
          REFERENCES site (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION,
        CONSTRAINT fk_hold_role_id
          FOREIGN KEY (role_id)
          REFERENCES role (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION,
        CONSTRAINT fk_hold_application_id
          FOREIGN KEY (application_id)
          REFERENCES application (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION)
      ENGINE = InnoDB;

      SELECT "Populating new hold table" AS "";

      -- add in withdrawn holds
      INSERT INTO hold( participant_id, hold_type_id, datetime, note )
      SELECT DISTINCT participant.id, hold_type.id, consent.datetime, "Created when the hold module was installed."
      FROM participant
      JOIN consent ON participant.id = consent.participant_id
      JOIN consent_type ON consent.consent_type_id = consent_type.id
      LEFT JOIN hold_type ON consent.accept = 0 AND hold_type.type = "final" AND hold_type.name = "withdrawn"
      WHERE participant.exclusion_id IS NULL
      AND consent_type.name = "participation";

      -- add in holds based on states
      INSERT INTO hold( participant_id, hold_type_id, datetime, note )
      SELECT participant.id, hold_type.id, UTC_TIMESTAMP(), "Created when the hold module was installed."
      FROM participant
      JOIN state ON participant.state_id = state.id
      JOIN hold_type ON state.name = hold_type.name;

      -- add in holds based on active bit
      INSERT IGNORE INTO hold( participant_id, hold_type_id, datetime, note )
      SELECT participant.id, hold_type.id, UTC_TIMESTAMP(), "Created when the hold module was installed."
      FROM hold_type, participant
      WHERE hold_type.type = "temporary" AND hold_type.name = "deactivated"
      AND participant.active = 0
      AND participant.exclusion_id IS NULL;

    END IF;

  END //
DELIMITER ;

CALL patch_hold();
DROP PROCEDURE IF EXISTS patch_hold;
