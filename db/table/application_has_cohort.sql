CREATE TABLE application_has_cohort (
  application_id INT(10) UNSIGNED NOT NULL,
  cohort_id INT(10) UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  create_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  grouping ENUM('region', 'jurisdiction') NOT NULL DEFAULT 'region',
  PRIMARY KEY (application_id, cohort_id),
  INDEX fk_cohort_id (cohort_id ASC),
  INDEX fk_application_id (application_id ASC),
  CONSTRAINT fk_application_has_cohort_application_id
    FOREIGN KEY (application_id)
    REFERENCES application (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_application_has_cohort_cohort_id
    FOREIGN KEY (cohort_id)
    REFERENCES cohort (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
