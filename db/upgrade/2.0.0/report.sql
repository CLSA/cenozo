CREATE TABLE IF NOT EXISTS report (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  report_type_id INT UNSIGNED NOT NULL,
  report_schedule_id INT UNSIGNED NULL DEFAULT NULL,
  user_id INT UNSIGNED NOT NULL,
  application_id INT UNSIGNED NOT NULL,
  site_id INT UNSIGNED NOT NULL,
  role_id INT UNSIGNED NOT NULL,
  datetime DATETIME NOT NULL,
  filename VARCHAR(255) NOT NULL,
  format ENUM('CSV', 'Excel', 'LibreOffice') NOT NULL DEFAULT 'CSV',
  PRIMARY KEY (id),
  INDEX fk_report_type_id (report_type_id ASC),
  INDEX fk_user_id (user_id ASC),
  INDEX fk_site_id (site_id ASC),
  INDEX fk_role_id (role_id ASC),
  INDEX fk_application_id (application_id ASC),
  INDEX fk_report_schedule_id (report_schedule_id ASC),
  INDEX dk_datetime (datetime ASC),
  CONSTRAINT fk_report_report_type_id
    FOREIGN KEY (report_type_id)
    REFERENCES report_type (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_report_user_id
    FOREIGN KEY (user_id)
    REFERENCES user (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_report_site_id
    FOREIGN KEY (site_id)
    REFERENCES site (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_report_role_id
    FOREIGN KEY (role_id)
    REFERENCES role (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_report_application_id
    FOREIGN KEY (application_id)
    REFERENCES application (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_report_report_schedule_id
    FOREIGN KEY (report_schedule_id)
    REFERENCES report_schedule (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;
