CREATE TABLE IF NOT EXISTS role_has_report_type (
  role_id INT UNSIGNED NOT NULL,
  report_type_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, report_type_id),
  INDEX fk_report_type_id (report_type_id ASC),
  INDEX fk_role_id (role_id ASC),
  CONSTRAINT fk_role_has_report_type_role_id
    FOREIGN KEY (role_id)
    REFERENCES role (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_role_has_report_type_report_type_id
    FOREIGN KEY (report_type_id)
    REFERENCES report_type (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;
