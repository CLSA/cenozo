CREATE TABLE role_has_overview (
  role_id int(10) unsigned NOT NULL,
  overview_id int(10) unsigned NOT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (role_id,overview_id),
  KEY fk_overview_id (overview_id),
  KEY fk_role_id (role_id),
  CONSTRAINT fk_role_has_overview_overview_id
    FOREIGN KEY (overview_id)
    REFERENCES overview (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_role_has_overview_role_id
    FOREIGN KEY (role_id)
    REFERENCES role (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;