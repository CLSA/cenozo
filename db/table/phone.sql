CREATE TABLE phone (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  alternate_id INT(10) UNSIGNED NULL DEFAULT NULL,
  participant_id INT(10) UNSIGNED NULL DEFAULT NULL,
  address_id INT(10) UNSIGNED NULL DEFAULT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  rank INT(11) NOT NULL,
  international TINYINT(1) NOT NULL DEFAULT 0,
  type ENUM('home', 'home2', 'work', 'work2', 'mobile', 'mobile2', 'other', 'other2') NOT NULL,
  number VARCHAR(127) NOT NULL,
  note TEXT NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_alternate_id_participant_id_rank (alternate_id ASC, participant_id ASC, rank ASC),
  INDEX fk_address_id (address_id ASC),
  INDEX fk_alternate_id (alternate_id ASC),
  INDEX fk_participant_id (participant_id ASC),
  CONSTRAINT fk_phone_address
    FOREIGN KEY (address_id)
    REFERENCES address (id)
    ON DELETE SET NULL
    ON UPDATE NO ACTION,
  CONSTRAINT fk_phone_alternate_id
    FOREIGN KEY (alternate_id)
    REFERENCES alternate (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_phone_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
