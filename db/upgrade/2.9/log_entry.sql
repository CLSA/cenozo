SELECT "Creating new log_entry table" AS "";

CREATE TABLE IF NOT EXISTS log_entry (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  application_id INT(10) UNSIGNED NOT NULL,
  datetime DATETIME NOT NULL,
  type VARCHAR(16) NOT NULL,
  user VARCHAR(45) NULL DEFAULT NULL,
  role VARCHAR(45) NULL DEFAULT NULL,
  site VARCHAR(45) NULL DEFAULT NULL,
  service VARCHAR(255) NULL DEFAULT NULL,
  description TEXT NULL DEFAULT NULL,
  stack_trace TEXT NULL DEFAULT NULL,
  PRIMARY KEY (id),
  INDEX fk_application_id (application_id ASC),
  INDEX dk_datetime (type ASC),
  INDEX dk_type (user ASC),
  INDEX dk_user (role ASC),
  INDEX dk_role (role ASC),
  INDEX dk_site (site ASC),
  INDEX dk_service (service ASC),
  CONSTRAINT fk_log_entry_application_id
    FOREIGN KEY (application_id)
    REFERENCES application (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;
