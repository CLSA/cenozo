CREATE TABLE application_type_has_role (
  application_type_id int(10) unsigned NOT NULL,
  role_id int(10) unsigned NOT NULL,
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  PRIMARY KEY (application_type_id,role_id),
  KEY fk_role_id (role_id),
  KEY fk_application_type_id (application_type_id),
  CONSTRAINT fk_application_type_has_role_application_type_id
    FOREIGN KEY (application_type_id)
    REFERENCES application_type (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_application_type_has_role_role_id
    FOREIGN KEY (role_id)
    REFERENCES role (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
