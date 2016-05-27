CREATE TABLE IF NOT EXISTS report_schedule_has_report_type_restriction (
  report_schedule_id INT UNSIGNED NOT NULL,
  report_restriction_id INT UNSIGNED NOT NULL,
  value VARCHAR(45) NOT NULL,
  PRIMARY KEY (report_schedule_id, report_restriction_id),
  INDEX fk_report_restriction_id (report_restriction_id ASC),
  INDEX fk_report_schedule_id (report_schedule_id ASC),
  CONSTRAINT fk_report_schedule_has_report_restriction_report_schedule_id
    FOREIGN KEY (report_schedule_id)
    REFERENCES report_schedule (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_report_schedule_has_report_restriction_report_restriction_id
    FOREIGN KEY (report_restriction_id)
    REFERENCES report_restriction (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;
