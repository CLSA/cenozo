DROP PROCEDURE IF EXISTS patch_trace;
DELIMITER //
CREATE PROCEDURE patch_trace()
  BEGIN

    SET @test = ( 
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "trace" );
    IF @test = 0 THEN

      SELECT "Creating new trace table" AS "";

      CREATE TABLE IF NOT EXISTS trace (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        update_timestamp TIMESTAMP NOT NULL,
        create_timestamp TIMESTAMP NOT NULL,
        participant_id INT UNSIGNED NOT NULL,
        trace_type_id INT UNSIGNED NULL,
        datetime DATETIME NOT NULL,
        user_id INT UNSIGNED NULL,
        site_id INT UNSIGNED NULL,
        role_id INT UNSIGNED NULL,
        application_id INT UNSIGNED NULL,
        note TEXT NULL,
        PRIMARY KEY (id),
        INDEX fk_participant_id (participant_id ASC),
        INDEX fk_trace_type_id (trace_type_id ASC),
        INDEX fk_user_id (user_id ASC),
        INDEX fk_site_id (site_id ASC),
        INDEX fk_role_id (role_id ASC),
        INDEX fk_application_id (application_id ASC),
        UNIQUE INDEX uq_participant_id_datetime (participant_id ASC, datetime ASC),
        CONSTRAINT fk_trace_participant_id
          FOREIGN KEY (participant_id)
          REFERENCES participant (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION,
        CONSTRAINT fk_trace_trace_type_id
          FOREIGN KEY (trace_type_id)
          REFERENCES trace_type (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION,
        CONSTRAINT fk_trace_user_id
          FOREIGN KEY (user_id)
          REFERENCES user (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION,
        CONSTRAINT fk_trace_site_id
          FOREIGN KEY (site_id)
          REFERENCES site (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION,
        CONSTRAINT fk_trace_role_id
          FOREIGN KEY (role_id)
          REFERENCES role (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION,
        CONSTRAINT fk_trace_application_id
          FOREIGN KEY (application_id)
          REFERENCES application (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION)
      ENGINE = InnoDB;

      SELECT "Populating new trace table" AS "";

      -- add in proxies based on states
      INSERT INTO trace( participant_id, trace_type_id, datetime, note )
      SELECT participant.id, trace_type.id, UTC_TIMESTAMP(), "Created when the trace module was installed."
      FROM participant
      JOIN state ON participant.state_id = state.id
      JOIN trace_type ON state.name = trace_type.name;

      -- import trace records from participants with missing address or phone
      CREATE TEMPORARY TABLE temp_address_count
      SELECT participant.id AS participant_id, IF( address.id IS NULL, 0, COUNT(*) ) AS total
      FROM participant
      LEFT JOIN address ON participant.id = address.participant_id AND address.active = 1
      GROUP BY participant.id;
      ALTER TABLE temp_address_count ADD INDEX dk_participant( participant_id );

      CREATE TEMPORARY TABLE temp_phone_count
      SELECT participant.id AS participant_id, IF( phone.id IS NULL, 0, COUNT(*) ) AS total
      FROM participant
      LEFT JOIN phone ON participant.id = phone.participant_id AND phone.active = 1
      GROUP BY participant.id;
      ALTER TABLE temp_phone_count ADD INDEX dk_participant( participant_id );

      INSERT INTO trace( participant_id, trace_type_id, datetime, note )
      SELECT participant.id, trace_type.id, UTC_TIMESTAMP(), "Created when the trace module was installed."
      FROM trace_type, participant
      LEFT JOIN trace ON participant.id = trace.participant_id
      JOIN temp_address_count ON participant.id = temp_address_count.participant_id
      JOIN temp_phone_count ON participant.id = temp_phone_count.participant_id
      WHERE trace_type.name = "local"
      AND trace.id IS NULL
      AND ( temp_address_count.total = 0 OR temp_phone_count.total = 0 );

    END IF;

  END //
DELIMITER ;

CALL patch_trace();
DROP PROCEDURE IF EXISTS patch_trace;
