SELECT "Creating new application_type table" AS "";

CREATE TABLE IF NOT EXISTS application_type (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  name VARCHAR(45) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_name (name ASC))
ENGINE = InnoDB;

INSERT IGNORE INTO application_type( name )
VALUES ('beartooth'), ('cedar'), ('mastodon'), ('sabretooth');
