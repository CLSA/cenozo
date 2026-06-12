CREATE TABLE failed_login (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  user_id int(10) unsigned NOT NULL,
  application_id int(10) unsigned NOT NULL,
  address varchar(45) NOT NULL,
  datetime datetime NOT NULL,
  PRIMARY KEY (id),
  KEY fk_user_id (user_id),
  KEY fk_application_id (application_id),
  CONSTRAINT fk_failed_login_application_id
    FOREIGN KEY (application_id)
    REFERENCES application (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_failed_login_user_id
    FOREIGN KEY (user_id)
    REFERENCES user (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
