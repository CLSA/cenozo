SELECT "Creating new relation_type table" AS "";

CREATE TABLE IF NOT EXISTS relation_type (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  rank INT(10) UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_rank (rank ASC),
  UNIQUE INDEX uq_name (name ASC))
ENGINE = InnoDB;
