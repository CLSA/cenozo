CREATE TABLE application_type_has_overview (
  application_type_id int(10) unsigned NOT NULL,
  overview_id int(10) unsigned NOT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (application_type_id,overview_id),
  KEY fk_overview_id (overview_id),
  KEY fk_application_type_id (application_type_id),
  CONSTRAINT fk_application_type_has_overview_application_type_id
    FOREIGN KEY (application_type_id)
    REFERENCES application_type (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_application_type_has_overview_overview_id
    FOREIGN KEY (overview_id)
    REFERENCES overview (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
