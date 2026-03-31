CREATE TABLE proxy (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  participant_id INT(10) UNSIGNED NOT NULL,
  proxy_type_id INT(10) UNSIGNED NULL DEFAULT NULL,
  datetime DATETIME NOT NULL,
  user_id INT(10) UNSIGNED NULL DEFAULT NULL,
  site_id INT(10) UNSIGNED NULL DEFAULT NULL,
  role_id INT(10) UNSIGNED NULL DEFAULT NULL,
  application_id INT(10) UNSIGNED NULL DEFAULT NULL,
  note TEXT NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_participant_id_datetime (participant_id ASC, datetime ASC),
  INDEX fk_participant_id (participant_id ASC),
  INDEX fk_proxy_type_id (proxy_type_id ASC),
  INDEX fk_user_id (user_id ASC),
  INDEX fk_site_id (site_id ASC),
  INDEX fk_role_id (role_id ASC),
  INDEX fk_application_id (application_id ASC),
  CONSTRAINT fk_proxy_application_id
    FOREIGN KEY (application_id)
    REFERENCES application (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
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
  CONSTRAINT fk_proxy_role_id
    FOREIGN KEY (role_id)
    REFERENCES role (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_proxy_site_id
    FOREIGN KEY (site_id)
    REFERENCES site (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_proxy_user_id
    FOREIGN KEY (user_id)
    REFERENCES user (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
