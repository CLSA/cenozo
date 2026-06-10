CREATE TABLE application_has_script (
  application_id int(10) unsigned NOT NULL,
  script_id int(10) unsigned NOT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (application_id,script_id),
  KEY fk_script_id (script_id),
  KEY fk_application_id (application_id),
  CONSTRAINT fk_application_has_script_application_id
    FOREIGN KEY (application_id)
    REFERENCES application (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_application_has_script_script_id
    FOREIGN KEY (script_id)
    REFERENCES script (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;