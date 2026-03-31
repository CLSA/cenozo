CREATE TABLE participant (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  uid VARCHAR(45) NOT NULL COMMENT 'External unique ID',
  source_id INT(10) UNSIGNED NULL DEFAULT NULL,
  cohort_id INT(10) UNSIGNED NOT NULL,
  grouping VARCHAR(45) NULL DEFAULT NULL,
  honorific VARCHAR(10) NOT NULL DEFAULT '',
  first_name VARCHAR(45) NOT NULL,
  other_name VARCHAR(100) NULL DEFAULT NULL,
  last_name VARCHAR(45) NOT NULL,
  sex ENUM('male', 'female') NOT NULL,
  gender_identity ENUM('man', 'woman', 'trans man', 'trans woman', 'non-binary', 'genderqueer', 'two-spirit', 'other') NOT NULL,
  pronouns VARCHAR(45) NULL DEFAULT NULL,
  date_of_birth DATE NULL DEFAULT NULL,
  date_of_death_accuracy ENUM('full date known', 'day unknown', 'month and day unknown') NULL DEFAULT NULL,
  date_of_death_ministry TINYINT(1) NULL DEFAULT NULL,
  date_of_death DATE NULL DEFAULT NULL,
  exclusion_id INT(10) UNSIGNED NULL DEFAULT NULL,
  language_id INT(10) UNSIGNED NOT NULL,
  availability_type_id INT(10) UNSIGNED NULL DEFAULT NULL,
  callback DATETIME NULL DEFAULT NULL,
  override_stratum TINYINT(1) NOT NULL DEFAULT 0,
  email VARCHAR(255) NULL DEFAULT NULL,
  email_datetime DATETIME NULL DEFAULT NULL,
  email_old VARCHAR(255) NULL DEFAULT NULL,
  email2 VARCHAR(255) NULL DEFAULT NULL,
  email2_datetime DATETIME NULL DEFAULT NULL,
  email2_old VARCHAR(255) NULL DEFAULT NULL,
  mass_email TINYINT(1) NOT NULL DEFAULT 1,
  delink TINYINT(1) NOT NULL DEFAULT 0,
  withdraw_third_party TINYINT(1) NULL DEFAULT NULL,
  out_of_area TINYINT(1) NOT NULL DEFAULT 0,
  low_education TINYINT(1) NOT NULL DEFAULT 0,
  global_note TEXT NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_uid (uid ASC),
  INDEX dk_uid (uid ASC),
  INDEX fk_cohort_id (cohort_id ASC),
  INDEX fk_source_id (source_id ASC),
  INDEX dk_email_datetime (email_datetime ASC),
  INDEX fk_language_id (language_id ASC),
  INDEX fk_availability_type_id (availability_type_id ASC),
  INDEX dk_callback (callback ASC),
  INDEX fk_exclusion_id (exclusion_id ASC),
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
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
