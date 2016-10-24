SELECT "Adding new export_file caching table" AS "";

CREATE TABLE IF NOT EXISTS export_file (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  export_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  size BIGINT NULL,
  stage ENUM('started', 'reading data', 'writing data', 'completed', 'failed') NOT NULL,
  progress FLOAT NOT NULL,
  datetime DATETIME NOT NULL,
  elapsed FLOAT NULL,
  PRIMARY KEY (id),
  INDEX fk_user_id (user_id ASC),
  INDEX dk_datetime (datetime ASC),
  INDEX fk_export_id (export_id ASC),
  CONSTRAINT fk_export_file_user_id
    FOREIGN KEY (user_id)
    REFERENCES user (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_export_file_export_id
    FOREIGN KEY (export_id)
    REFERENCES export (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;
