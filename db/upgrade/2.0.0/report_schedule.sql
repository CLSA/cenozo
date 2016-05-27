CREATE TABLE IF NOT EXISTS report_schedule (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  report_type_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  application_id INT UNSIGNED NOT NULL,
  site_id INT UNSIGNED NOT NULL,
  role_id INT UNSIGNED NOT NULL,
  schedule ENUM('daily', 'weekly', 'monthly') NOT NULL,
  format ENUM('CSV', 'Excel', 'LibreOffice') NOT NULL DEFAULT 'CSV',
  PRIMARY KEY (id),
  INDEX fk_report_type_id (report_type_id ASC),
  INDEX fk_user_id (user_id ASC),
  INDEX fk_application_id (application_id ASC),
  INDEX fk_site_id (site_id ASC),
  INDEX fk_role_id (role_id ASC),
  INDEX dk_repeat (schedule ASC),
  CONSTRAINT fk_report_schedule_report_type_id
    FOREIGN KEY (report_type_id)
    REFERENCES report_type (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_report_schedule_user_id
    FOREIGN KEY (user_id)
    REFERENCES user (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_report_schedule_application_id
    FOREIGN KEY (application_id)
    REFERENCES application (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_report_schedule_site_id
    FOREIGN KEY (site_id)
    REFERENCES site (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_report_schedule_role_id
    FOREIGN KEY (role_id)
    REFERENCES role (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;
