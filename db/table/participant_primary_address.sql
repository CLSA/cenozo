CREATE TABLE participant_primary_address (
  participant_id int(10) unsigned NOT NULL,
  address_id int(10) unsigned DEFAULT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (participant_id),
  KEY fk_participant_id (participant_id),
  KEY fk_address_id (address_id),
  CONSTRAINT fk_participant_primary_address_address_id
    FOREIGN KEY (address_id)
    REFERENCES address (id)
    ON DELETE SET NULL
    ON UPDATE NO ACTION,
  CONSTRAINT fk_participant_primary_address_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;