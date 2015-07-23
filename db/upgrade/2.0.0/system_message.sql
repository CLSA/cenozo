SELECT "Creating new system_message (global) table" AS "";

DROP TABLE IF EXISTS system_message;
CREATE TABLE IF NOT EXISTS system_message (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  application_id INT UNSIGNED NULL,
  site_id INT UNSIGNED NULL,
  role_id INT UNSIGNED NULL,
  title VARCHAR(255) NULL,
  note TEXT NULL,
  expiry DATETIME NULL,
  PRIMARY KEY (id),
  INDEX fk_site_id (site_id ASC),
  INDEX fk_role_id (role_id ASC),
  INDEX fk_system_message_id (application_id ASC),
  CONSTRAINT fk_system_message_site_id
    FOREIGN KEY (site_id)
    REFERENCES site (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_system_message_role_id
    FOREIGN KEY (role_id)
    REFERENCES role (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_system_message_application_id
    FOREIGN KEY (application_id)
    REFERENCES application (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;
