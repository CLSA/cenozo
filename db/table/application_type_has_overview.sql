CREATE TABLE application_type_has_overview (
  application_type_id INT(10) UNSIGNED NOT NULL,
  overview_id INT(10) UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (application_type_id, overview_id),
  INDEX fk_overview_id (overview_id ASC),
  INDEX fk_application_type_id (application_type_id ASC),
  CONSTRAINT fk_application_type_has_overview_application_type_id
    FOREIGN KEY (application_type_id)
    REFERENCES application_type (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_application_type_has_overview_overview_id
    FOREIGN KEY (overview_id)
    REFERENCES overview (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
