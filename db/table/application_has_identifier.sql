CREATE TABLE application_has_identifier (
  application_id INT(10) UNSIGNED NOT NULL,
  identifier_id INT(10) UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (application_id, identifier_id),
  INDEX fk_identifier_id (identifier_id ASC),
  INDEX fk_application_id (application_id ASC),
  CONSTRAINT fk_application_has_identifier_application_id
    FOREIGN KEY (application_id)
    REFERENCES application (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_application_has_identifier_identifier_id
    FOREIGN KEY (identifier_id)
    REFERENCES identifier (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
