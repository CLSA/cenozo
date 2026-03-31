CREATE TABLE system_message (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  application_id INT(10) UNSIGNED NULL DEFAULT NULL,
  site_id INT(10) UNSIGNED NULL DEFAULT NULL,
  role_id INT(10) UNSIGNED NULL DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  note TEXT NOT NULL,
  expiry DATE NULL DEFAULT NULL,
  PRIMARY KEY (id),
  INDEX fk_site_id (site_id ASC),
  INDEX fk_role_id (role_id ASC),
  INDEX fk_system_message_id (application_id ASC),
  CONSTRAINT fk_system_message_application_id
    FOREIGN KEY (application_id)
    REFERENCES application (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_system_message_role_id
    FOREIGN KEY (role_id)
    REFERENCES role (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_system_message_site_id
    FOREIGN KEY (site_id)
    REFERENCES site (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
