CREATE TABLE activity_archive (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  user_id int(10) unsigned NOT NULL,
  application_id int(10) unsigned NOT NULL,
  site_id int(10) unsigned NOT NULL,
  role_id int(10) unsigned NOT NULL,
  start_datetime datetime NOT NULL,
  end_datetime datetime DEFAULT NULL,
  PRIMARY KEY (id),
  KEY fk_user_id (user_id),
  KEY fk_site_id (site_id),
  KEY fk_role_id (role_id),
  KEY fk_application_id (application_id),
  CONSTRAINT fk_activity_archive_application_id
    FOREIGN KEY (application_id)
    REFERENCES application (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_activity_archive_role_id
    FOREIGN KEY (role_id)
    REFERENCES role (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_activity_archive_site_id
    FOREIGN KEY (site_id)
    REFERENCES site (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_activity_archive_user_id
    FOREIGN KEY (user_id)
    REFERENCES user (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;