DROP PROCEDURE IF EXISTS patch_proxy;
DELIMITER //
CREATE PROCEDURE patch_proxy()
  BEGIN

    SET @test = ( 
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "proxy" );
    IF @test = 0 THEN

      SELECT "Creating new proxy table" AS "";

      CREATE TABLE IF NOT EXISTS proxy (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        update_timestamp TIMESTAMP NOT NULL,
        create_timestamp TIMESTAMP NOT NULL,
        participant_id INT UNSIGNED NOT NULL,
        proxy_type_id INT UNSIGNED NULL,
        datetime DATETIME NOT NULL,
        user_id INT UNSIGNED NULL,
        site_id INT UNSIGNED NULL,
        role_id INT UNSIGNED NULL,
        application_id INT UNSIGNED NULL,
        note TEXT NULL,
        PRIMARY KEY (id),
        INDEX fk_participant_id (participant_id ASC),
        INDEX fk_proxy_type_id (proxy_type_id ASC),
        INDEX fk_user_id (user_id ASC),
        INDEX fk_site_id (site_id ASC),
        INDEX fk_role_id (role_id ASC),
        INDEX fk_application_id (application_id ASC),
        UNIQUE INDEX uq_participant_id_datetime (participant_id ASC, datetime ASC),
        CONSTRAINT fk_proxy_participant_id
          FOREIGN KEY (participant_id)
          REFERENCES participant (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION,
        CONSTRAINT fk_proxy_proxy_type_id
          FOREIGN KEY (proxy_type_id)
          REFERENCES proxy_type (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION,
        CONSTRAINT fk_proxy_user_id
          FOREIGN KEY (user_id)
          REFERENCES user (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION,
        CONSTRAINT fk_proxy_site_id
          FOREIGN KEY (site_id)
          REFERENCES site (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION,
        CONSTRAINT fk_proxy_role_id
          FOREIGN KEY (role_id)
          REFERENCES role (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION,
        CONSTRAINT fk_proxy_application_id
          FOREIGN KEY (application_id)
          REFERENCES application (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION)
      ENGINE = InnoDB;

      SELECT "Populating new proxy table" AS "";

      -- add in proxies based on states
      INSERT INTO proxy( participant_id, proxy_type_id, datetime, note )
      SELECT participant.id, proxy_type.id, UTC_TIMESTAMP(), "Created when the proxy module was installed."
      FROM participant
      JOIN state ON participant.state_id = state.id
      JOIN proxy_type ON state.name = proxy_type.name;

    END IF;

  END //
DELIMITER ;

CALL patch_proxy();
DROP PROCEDURE IF EXISTS patch_proxy;
