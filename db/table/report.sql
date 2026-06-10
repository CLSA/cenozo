CREATE TABLE report (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  report_type_id int(10) unsigned NOT NULL,
  report_schedule_id int(10) unsigned DEFAULT NULL,
  user_id int(10) unsigned NOT NULL,
  application_id int(10) unsigned NOT NULL,
  site_id int(10) unsigned NOT NULL,
  role_id int(10) unsigned NOT NULL,
  format enum('CSV','Excel','LibreOffice') NOT NULL DEFAULT 'CSV',
  size bigint(20) unsigned DEFAULT NULL,
  stage enum('started','reading data','writing data','completed','failed') NOT NULL DEFAULT 'started',
  progress float NOT NULL DEFAULT 0,
  datetime datetime NOT NULL,
  elapsed float DEFAULT NULL,
  PRIMARY KEY (id),
  KEY fk_report_type_id (report_type_id),
  KEY fk_user_id (user_id),
  KEY fk_site_id (site_id),
  KEY fk_role_id (role_id),
  KEY fk_application_id (application_id),
  KEY fk_report_schedule_id (report_schedule_id),
  KEY dk_datetime (datetime),
  KEY dk_stage (stage),
  KEY dk_size (size),
  CONSTRAINT fk_report_application_id
    FOREIGN KEY (application_id)
    REFERENCES application (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_report_report_schedule_id
    FOREIGN KEY (report_schedule_id)
    REFERENCES report_schedule (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_report_report_type_id
    FOREIGN KEY (report_type_id)
    REFERENCES report_type (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_report_role_id
    FOREIGN KEY (role_id)
    REFERENCES role (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_report_site_id
    FOREIGN KEY (site_id)
    REFERENCES site (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_report_user_id
    FOREIGN KEY (user_id)
    REFERENCES user (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;