CREATE TABLE role_has_report_type (
  role_id INT(10) UNSIGNED NOT NULL,
  report_type_id INT(10) UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (role_id, report_type_id),
  INDEX fk_report_type_id (report_type_id ASC),
  INDEX fk_role_id (role_id ASC),
  CONSTRAINT fk_role_has_report_type_report_type_id
    FOREIGN KEY (report_type_id)
    REFERENCES report_type (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_role_has_report_type_role_id
    FOREIGN KEY (role_id)
    REFERENCES role (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
