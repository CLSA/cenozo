CREATE TABLE system_message (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  application_id int(10) unsigned DEFAULT NULL,
  site_id int(10) unsigned DEFAULT NULL,
  role_id int(10) unsigned DEFAULT NULL,
  title varchar(255) NOT NULL,
  note mediumtext NOT NULL,
  expiry date DEFAULT NULL,
  PRIMARY KEY (id),
  KEY fk_site_id (site_id),
  KEY fk_role_id (role_id),
  KEY fk_system_message_id (application_id),
  CONSTRAINT fk_system_message_application_id
    FOREIGN KEY (application_id)
    REFERENCES application (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_system_message_role_id
    FOREIGN KEY (role_id)
    REFERENCES role (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_system_message_site_id
    FOREIGN KEY (site_id)
    REFERENCES site (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
