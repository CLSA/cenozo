CREATE TABLE report_has_report_restriction (
  report_id INT(10) UNSIGNED NOT NULL,
  report_restriction_id INT(10) UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  value TEXT NOT NULL,
  PRIMARY KEY (report_id, report_restriction_id),
  INDEX fk_report_restriction_id (report_restriction_id ASC),
  INDEX fk_report_id (report_id ASC),
  UNIQUE INDEX uq_report_id_report_restriction_id (report_id ASC, report_restriction_id ASC),
  CONSTRAINT fk_report_has_report_restriction_report_id
    FOREIGN KEY (report_id)
    REFERENCES report (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_report_has_report_restriction_report_restriction_id
    FOREIGN KEY (report_restriction_id)
    REFERENCES report_restriction (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
