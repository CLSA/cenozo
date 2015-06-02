SELECT "Creating new collection table" AS "";

CREATE TABLE IF NOT EXISTS collection (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  name VARCHAR(45) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  locked TINYINT(1) NOT NULL DEFAULT 0,
  description TEXT NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_name (name ASC))
ENGINE = InnoDB;
