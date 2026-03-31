CREATE TABLE application_has_script (
  application_id INT(10) UNSIGNED NOT NULL,
  script_id INT(10) UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (application_id, script_id),
  INDEX fk_script_id (script_id ASC),
  INDEX fk_application_id (application_id ASC),
  CONSTRAINT fk_application_has_script_application_id
    FOREIGN KEY (application_id)
    REFERENCES application (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_application_has_script_script_id
    FOREIGN KEY (script_id)
    REFERENCES script (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
