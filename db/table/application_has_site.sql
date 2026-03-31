CREATE TABLE application_has_site (
  application_id INT(10) UNSIGNED NOT NULL,
  site_id INT(10) UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (application_id, site_id),
  INDEX fk_site_id (site_id ASC),
  INDEX fk_application_id (application_id ASC),
  CONSTRAINT fk_application_has_site_application_id
    FOREIGN KEY (application_id)
    REFERENCES application (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_application_has_site_site_id
    FOREIGN KEY (site_id)
    REFERENCES site (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
