CREATE TABLE phone (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  alternate_id int(10) unsigned DEFAULT NULL,
  participant_id int(10) unsigned DEFAULT NULL,
  address_id int(10) unsigned DEFAULT NULL,
  active tinyint(1) NOT NULL DEFAULT 1,
  rank int(11) NOT NULL,
  international tinyint(1) NOT NULL DEFAULT 0,
  type enum('home','home2','work','work2','mobile','mobile2','other','other2') NOT NULL,
  number varchar(127) NOT NULL,
  note mediumtext DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_alternate_id_participant_id_rank (alternate_id,participant_id,rank),
  KEY fk_address_id (address_id),
  KEY fk_alternate_id (alternate_id),
  KEY fk_participant_id (participant_id),
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
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;