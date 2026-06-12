CREATE TABLE export_file (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  export_id int(10) unsigned NOT NULL,
  user_id int(10) unsigned NOT NULL,
  size bigint(20) DEFAULT NULL,
  stage enum('started','reading data','writing data','completed','failed') NOT NULL,
  progress float NOT NULL DEFAULT 0,
  datetime datetime NOT NULL,
  elapsed float DEFAULT NULL,
  PRIMARY KEY (id),
  KEY fk_user_id (user_id),
  KEY dk_datetime (datetime),
  KEY fk_export_id (export_id),
  CONSTRAINT fk_export_file_export_id
    FOREIGN KEY (export_id)
    REFERENCES export (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_export_file_user_id
    FOREIGN KEY (user_id)
    REFERENCES user (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
