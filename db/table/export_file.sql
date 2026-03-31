CREATE TABLE export_file (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  export_id INT(10) UNSIGNED NOT NULL,
  user_id INT(10) UNSIGNED NOT NULL,
  size BIGINT(20) NULL DEFAULT NULL,
  stage ENUM('started', 'reading data', 'writing data', 'completed', 'failed') NOT NULL,
  progress FLOAT NOT NULL DEFAULT 0,
  datetime DATETIME NOT NULL,
  elapsed FLOAT NULL DEFAULT NULL,
  PRIMARY KEY (id),
  INDEX fk_user_id (user_id ASC),
  INDEX dk_datetime (datetime ASC),
  INDEX fk_export_id (export_id ASC),
  CONSTRAINT fk_export_file_export_id
    FOREIGN KEY (export_id)
    REFERENCES export (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_export_file_user_id
    FOREIGN KEY (user_id)
    REFERENCES user (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
