CREATE TABLE user_ip_address (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  user_id int(10) unsigned NOT NULL,
  ip_address varchar(45) NOT NULL,
  datetime datetime NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_id_ip_address (user_id,ip_address),
  KEY fk_user_id (user_id),
  CONSTRAINT fk_user_ip_address_user_id
    FOREIGN KEY (user_id)
    REFERENCES user (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;