SELECT "Creating new next_of_kin (global) table" AS "";

CREATE TABLE IF NOT EXISTS next_of_kin (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp VARCHAR(45) NULL DEFAULT NULL,
  create_timestamp VARCHAR(45) NULL DEFAULT NULL,
  participant_id INT UNSIGNED NOT NULL,
  first_name VARCHAR(45) NULL DEFAULT NULL,
  last_name VARCHAR(45) NULL DEFAULT NULL,
  gender VARCHAR(10) NULL DEFAULT NULL,
  phone VARCHAR(100) NULL DEFAULT NULL,
  street VARCHAR(255) NULL DEFAULT NULL,
  city VARCHAR(100) NULL DEFAULT NULL,
  province VARCHAR(45) NULL DEFAULT NULL,
  postal_code VARCHAR(45) NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_participant_id (participant_id ASC),
  CONSTRAINT fk_next_of_kin_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;
