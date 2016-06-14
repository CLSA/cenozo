SELECT "Creating new report_type table" AS "";

CREATE TABLE IF NOT EXISTS report_type (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  name VARCHAR(45) NOT NULL,
  title VARCHAR(255) NOT NULL,
  subject VARCHAR(45) NOT NULL,
  description TEXT NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_name (name ASC))
ENGINE = InnoDB;

INSERT IGNORE INTO report_type ( name, title, subject, description ) VALUES
( 'contact', 'Contact', 'participant', 'This report provides the current mailing and email address for a list of participants. The participant\'s current mailing address is defined as the highest ranking address which is not disabled on the current month.' ),
( 'email', 'Email Changes', 'participant', 'This report provides a list of all participants who last changed their email address between the provided dates (inclusive). Note that participants who do not have an email address will not be included in the list provided.' );
