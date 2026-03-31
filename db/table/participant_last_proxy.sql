CREATE TABLE participant_last_proxy (
  participant_id INT(10) UNSIGNED NOT NULL,
  proxy_id INT(10) UNSIGNED NULL DEFAULT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (participant_id),
  INDEX fk_proxy_id (proxy_id ASC),
  CONSTRAINT fk_participant_last_proxy_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_participant_last_proxy_proxy_id
    FOREIGN KEY (proxy_id)
    REFERENCES proxy (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
