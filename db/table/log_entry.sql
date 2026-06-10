CREATE TABLE log_entry (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  application_id int(10) unsigned NOT NULL,
  datetime datetime NOT NULL,
  type varchar(16) NOT NULL,
  user varchar(45) DEFAULT NULL,
  role varchar(45) DEFAULT NULL,
  site varchar(45) DEFAULT NULL,
  service varchar(255) DEFAULT NULL,
  description text DEFAULT NULL,
  stack_trace text DEFAULT NULL,
  PRIMARY KEY (id),
  KEY fk_application_id (application_id),
  KEY dk_datetime (type),
  KEY dk_type (user),
  KEY dk_user (role),
  KEY dk_role (role),
  KEY dk_site (site),
  KEY dk_service (service),
  CONSTRAINT fk_log_entry_application_id
    FOREIGN KEY (application_id)
    REFERENCES application (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;