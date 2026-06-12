CREATE TABLE application (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  name varchar(45) NOT NULL,
  title varchar(45) NOT NULL,
  application_type_id int(10) unsigned NOT NULL,
  url varchar(511) NOT NULL,
  version varchar(45) NOT NULL,
  cenozo varchar(45) NOT NULL,
  active tinyint(1) NOT NULL DEFAULT 1,
  release_based tinyint(1) NOT NULL DEFAULT 1,
  release_event_type_id int(10) unsigned DEFAULT NULL,
  site_based tinyint(1) NOT NULL DEFAULT 0,
  update_queue tinyint(1) NOT NULL DEFAULT 0,
  country_id int(10) unsigned NOT NULL,
  timezone varchar(45) NOT NULL DEFAULT 'Canada/Eastern',
  primary_color char(7) NOT NULL DEFAULT '#3f3f7d',
  secondary_color char(7) NOT NULL DEFAULT '#9ba8b7',
  theme_expired tinyint(1) NOT NULL DEFAULT 1,
  study_phase_id int(10) unsigned DEFAULT NULL,
  login_footer mediumtext DEFAULT NULL,
  mail_name varchar(255) DEFAULT NULL,
  mail_address varchar(127) DEFAULT NULL,
  mail_header mediumtext DEFAULT NULL,
  mail_footer mediumtext DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_name (name),
  KEY fk_release_event_type_id (release_event_type_id),
  KEY fk_application_type_id (application_type_id),
  KEY fk_study_phase_id (study_phase_id),
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
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
