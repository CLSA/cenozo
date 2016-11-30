SELECT "Creating new overview table" AS "";

CREATE TABLE IF NOT EXISTS overview (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  name VARCHAR(45) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_name (name ASC))
ENGINE = InnoDB;

SELECT "Adding overviews" AS "";

INSERT IGNORE INTO overview( name, title, description ) VALUES
( 'state', 'State', 'Overview of states (participants in conditions).' ),
( 'withdraw', 'Withdraw', 'Overview of withdrawn participants.' );
