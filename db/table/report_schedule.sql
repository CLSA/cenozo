CREATE TABLE report_schedule (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  report_type_id int(10) unsigned NOT NULL,
  user_id int(10) unsigned NOT NULL,
  application_id int(10) unsigned NOT NULL,
  site_id int(10) unsigned NOT NULL,
  role_id int(10) unsigned NOT NULL,
  schedule enum('daily','weekly','monthly') NOT NULL,
  format enum('CSV','Excel','LibreOffice') NOT NULL DEFAULT 'CSV',
  PRIMARY KEY (id),
  KEY fk_report_type_id (report_type_id),
  KEY fk_user_id (user_id),
  KEY fk_application_id (application_id),
  KEY fk_site_id (site_id),
  KEY fk_role_id (role_id),
  KEY dk_repeat (schedule),
  CONSTRAINT fk_report_schedule_application_id
    FOREIGN KEY (application_id)
    REFERENCES application (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_report_schedule_report_type_id
    FOREIGN KEY (report_type_id)
    REFERENCES report_type (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_report_schedule_role_id
    FOREIGN KEY (role_id)
    REFERENCES role (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_report_schedule_site_id
    FOREIGN KEY (site_id)
    REFERENCES site (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_report_schedule_user_id
    FOREIGN KEY (user_id)
    REFERENCES user (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
