SELECT "Creating new user_ip_address table" AS "";

CREATE TABLE IF NOT EXISTS user_ip_address (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  user_id INT(10) UNSIGNED NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  datetime DATETIME NOT NULL,
  PRIMARY KEY (id),
  INDEX fk_user_id (user_id ASC),
  UNIQUE INDEX uq_user_id_ip_address (user_id ASC, ip_address ASC),
  CONSTRAINT fk_user_ip_address_user_id
    FOREIGN KEY (user_id)
    REFERENCES user (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;
