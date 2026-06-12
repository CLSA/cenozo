CREATE TABLE participant_last_proxy (
  participant_id int(10) unsigned NOT NULL,
  proxy_id int(10) unsigned DEFAULT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (participant_id),
  KEY fk_proxy_id (proxy_id),
  CONSTRAINT fk_participant_last_proxy_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_participant_last_proxy_proxy_id
    FOREIGN KEY (proxy_id)
    REFERENCES proxy (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
