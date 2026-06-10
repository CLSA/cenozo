CREATE TABLE application_has_cohort (
  application_id int(10) unsigned NOT NULL,
  cohort_id int(10) unsigned NOT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  grouping enum('region','jurisdiction') NOT NULL DEFAULT 'region',
  PRIMARY KEY (application_id,cohort_id),
  KEY fk_cohort_id (cohort_id),
  KEY fk_application_id (application_id),
  CONSTRAINT fk_application_has_cohort_application_id
    FOREIGN KEY (application_id)
    REFERENCES application (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_application_has_cohort_cohort_id
    FOREIGN KEY (cohort_id)
    REFERENCES cohort (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;