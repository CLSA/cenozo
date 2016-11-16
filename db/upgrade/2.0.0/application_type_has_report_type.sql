SELECT "Creating new application_type_has_report_type table" AS "";

CREATE TABLE IF NOT EXISTS application_type_has_report_type (
  application_type_id INT UNSIGNED NOT NULL,
  report_type_id INT UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
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
ENGINE = InnoDB;
