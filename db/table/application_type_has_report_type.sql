CREATE TABLE application_type_has_report_type (
  application_type_id INT(10) UNSIGNED NOT NULL,
  report_type_id INT(10) UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (application_type_id, report_type_id),
  INDEX fk_report_type_id (report_type_id ASC),
  INDEX fk_application_type_id (application_type_id ASC),
  CONSTRAINT fk_application_type_has_report_type_application_type_id
    FOREIGN KEY (application_type_id)
    REFERENCES application_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_application_type_has_report_type_report_type_id
    FOREIGN KEY (report_type_id)
    REFERENCES report_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
