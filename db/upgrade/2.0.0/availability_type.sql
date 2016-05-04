SELECT "Creating new availability_type table" AS "";

CREATE TABLE IF NOT EXISTS availability_type (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  name VARCHAR(25) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_name (name ASC))
ENGINE = InnoDB;

INSERT IGNORE INTO availability_type( name ) VALUES ("saturdays"), ("weeknights"), ("saturdays and weeknights");
