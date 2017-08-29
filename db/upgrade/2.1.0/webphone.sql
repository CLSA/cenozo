SELECT "Creating new webphone table" AS "";

CREATE TABLE IF NOT EXISTS webphone (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  ip VARCHAR(15) NOT NULL,
  site_id INT UNSIGNED NOT NULL,
  webphone VARCHAR(45) NOT NULL,
  PRIMARY KEY (id),
  INDEX fk_site_id (site_id ASC),
  UNIQUE INDEX uq_ip_site_id (ip ASC, site_id ASC),
  CONSTRAINT fk_webphone_site_id
    FOREIGN KEY (site_id)
    REFERENCES site (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;
