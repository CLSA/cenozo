CREATE TABLE IF NOT EXISTS report_restriction (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  report_type_id INT UNSIGNED NOT NULL,
  name VARCHAR(45) NOT NULL,
  title VARCHAR(45) NOT NULL,
  restriction_type ENUM('table', 'uid_list', 'string', 'integer', 'decimal', 'date', 'datetime', 'time') NOT NULL,
  subject VARCHAR(45) NULL,
  mandatory TINYINT(1) NOT NULL DEFAULT 0,
  description TEXT NULL,
  PRIMARY KEY (id),
  INDEX fk_report_type_id (report_type_id ASC),
  UNIQUE INDEX uq_report_type_id_name (report_type_id ASC, name ASC),
  CONSTRAINT fk_report_restriction_report_type_id
    FOREIGN KEY (report_type_id)
    REFERENCES report_type (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;

INSERT IGNORE INTO report_restriction ( report_type_id, name, title, restriction_type, subject, mandatory, description )
SELECT report_type.id, 'uid_list', 'Participant List', 'uid_list', NULL, 1, 'Provide a list of participant unique identifiers (UIDs) for which the report is to include'
FROM report_type
WHERE report_type.name = 'Contact';
