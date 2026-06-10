CREATE TABLE export (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  application_id int(10) unsigned NOT NULL,
  title varchar(255) NOT NULL,
  user_id int(10) unsigned NOT NULL,
  description mediumtext DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_application_id_title (application_id,title),
  KEY fk_user_id (user_id),
  KEY fk_export_application_id (application_id),
  CONSTRAINT fk_export_application_id
    FOREIGN KEY (application_id)
    REFERENCES application (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_export_user_id
    FOREIGN KEY (user_id)
    REFERENCES user (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;