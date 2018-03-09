SELECT "Creating new study_phase table" AS "";

CREATE TABLE IF NOT EXISTS study_phase (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  rank INT UNSIGNED NOT NULL,
  name VARCHAR(45) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_rank (rank ASC),
  UNIQUE INDEX uq_name (name ASC))
ENGINE = InnoDB;

INSERT IGNORE INTO study_phase( rank, name ) VALUES
( 1, "Baseline" ),
( 2, "Follow-up 1" ),
( 3, "Follow-up 2" ),
( 3, "Follow-up 3" ),
( 3, "Follow-up 4" ),
( 3, "Follow-up 5" ),
( 3, "Follow-up 6" ),
( 3, "Follow-up 7" );
