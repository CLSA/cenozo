SELECT "Creating new overview table" AS "";

CREATE TABLE IF NOT EXISTS overview (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_title (title ASC))
ENGINE = InnoDB;
