CREATE TABLE IF NOT EXISTS report_type (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  name VARCHAR(45) NOT NULL,
  title VARCHAR(255) NOT NULL,
  application_id INT UNSIGNED NULL DEFAULT NULL,
  description TEXT NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_name (name ASC),
  INDEX fk_application_id (application_id ASC),
  CONSTRAINT fk_report_type_application_id
    FOREIGN KEY (application_id)
    REFERENCES application (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;

INSERT IGNORE INTO report_type ( name, title, application_id, description ) VALUES
( 'contact', 'Contact Report', NULL, 'This report provides the current mailing and email address for a list of participants. The participant\'s current mailing address is defined as the highest ranking address which is not disabled on the current month.' );
