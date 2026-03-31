CREATE TABLE application (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  name VARCHAR(45) NOT NULL,
  title VARCHAR(45) NOT NULL,
  application_type_id INT(10) UNSIGNED NOT NULL,
  url VARCHAR(511) NOT NULL,
  version VARCHAR(45) NOT NULL,
  cenozo VARCHAR(45) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  release_based TINYINT(1) NOT NULL DEFAULT 1,
  release_event_type_id INT(10) UNSIGNED NULL DEFAULT NULL,
  site_based TINYINT(1) NOT NULL DEFAULT 0,
  update_queue TINYINT(1) NOT NULL DEFAULT 0,
  country_id INT UNSIGNED NOT NULL,
  timezone VARCHAR(45) NOT NULL DEFAULT 'Canada/Eastern',
  primary_color CHAR(7) NOT NULL DEFAULT '#3f3f7d',
  secondary_color CHAR(7) NOT NULL DEFAULT '#9ba8b7',
  theme_expired TINYINT(1) NOT NULL DEFAULT 1,
  study_phase_id INT(10) UNSIGNED NULL DEFAULT NULL,
  login_footer TEXT NULL DEFAULT NULL,
  mail_name VARCHAR(255) NULL DEFAULT NULL,
  mail_address VARCHAR(127) NULL DEFAULT NULL,
  mail_header TEXT NULL DEFAULT NULL,
  mail_footer TEXT NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_name (name ASC),
  INDEX fk_release_event_type_id (release_event_type_id ASC),
  INDEX fk_application_type_id (application_type_id ASC),
  INDEX fk_study_phase_id (study_phase_id ASC),
  INDEX fk_country_id (country_id ASC),
  CONSTRAINT fk_application_application_type_id
    FOREIGN KEY (application_type_id)
    REFERENCES application_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_application_release_event_type_id
    FOREIGN KEY (release_event_type_id)
    REFERENCES event_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_application_study_phase_id
    FOREIGN KEY (study_phase_id)
    REFERENCES study_phase (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_application_country_id
    FOREIGN KEY (country_id)
    REFERENCES country (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
