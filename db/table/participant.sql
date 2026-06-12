CREATE TABLE participant (
  id int(10) unsigned NOT NULL AUTO_INCREMENT,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  uid varchar(45) NOT NULL COMMENT 'External unique ID',
  source_id int(10) unsigned DEFAULT NULL,
  cohort_id int(10) unsigned NOT NULL,
  grouping varchar(45) DEFAULT NULL,
  honorific varchar(10) NOT NULL DEFAULT '',
  first_name varchar(45) NOT NULL,
  other_name varchar(100) DEFAULT NULL,
  last_name varchar(45) NOT NULL,
  sex enum('male','female') NOT NULL,
  gender_identity enum('man','woman','trans man','trans woman','non-binary','genderqueer','two-spirit','other') NOT NULL,
  pronouns varchar(45) DEFAULT NULL,
  date_of_birth date DEFAULT NULL,
  date_of_death_accuracy enum('full date known','day unknown','month and day unknown') DEFAULT NULL,
  date_of_death_ministry tinyint(1) DEFAULT NULL,
  date_of_death date DEFAULT NULL,
  exclusion_id int(10) unsigned DEFAULT NULL,
  language_id int(10) unsigned NOT NULL,
  availability_type_id int(10) unsigned DEFAULT NULL,
  callback datetime DEFAULT NULL,
  override_stratum tinyint(1) NOT NULL DEFAULT 0,
  email varchar(255) DEFAULT NULL,
  email_datetime datetime DEFAULT NULL,
  email_old varchar(255) DEFAULT NULL,
  email2 varchar(255) DEFAULT NULL,
  email2_datetime datetime DEFAULT NULL,
  email2_old varchar(255) DEFAULT NULL,
  mass_email tinyint(1) NOT NULL DEFAULT 1,
  delink tinyint(1) NOT NULL DEFAULT 0,
  withdraw_third_party tinyint(1) DEFAULT NULL,
  out_of_area tinyint(1) NOT NULL DEFAULT 0,
  low_education tinyint(1) NOT NULL DEFAULT 0,
  global_note mediumtext DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_uid (uid),
  KEY dk_uid (uid),
  KEY fk_cohort_id (cohort_id),
  KEY fk_source_id (source_id),
  KEY dk_email_datetime (email_datetime),
  KEY fk_language_id (language_id),
  KEY fk_availability_type_id (availability_type_id),
  KEY dk_callback (callback),
  KEY fk_exclusion_id (exclusion_id),
  CONSTRAINT fk_participant_availability_type_id
    FOREIGN KEY (availability_type_id)
    REFERENCES availability_type (id)
    ON DELETE SET NULL
    ON UPDATE NO ACTION,
  CONSTRAINT fk_participant_cohort_id
    FOREIGN KEY (cohort_id)
    REFERENCES cohort (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_participant_exclusion_id
    FOREIGN KEY (exclusion_id)
    REFERENCES exclusion (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_participant_language_id
    FOREIGN KEY (language_id)
    REFERENCES language (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_participant_source_id
    FOREIGN KEY (source_id)
    REFERENCES source (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
