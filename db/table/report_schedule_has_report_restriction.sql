CREATE TABLE report_schedule_has_report_restriction (
  report_schedule_id int(10) unsigned NOT NULL,
  report_restriction_id int(10) unsigned NOT NULL,
  update_timestamp timestamp NOT NULL DEFAULT current_timestamp()
    ON UPDATE current_timestamp(),
  create_timestamp timestamp NOT NULL DEFAULT current_timestamp(),
  value mediumtext NOT NULL,
  PRIMARY KEY (report_schedule_id,report_restriction_id),
  KEY fk_report_restriction_id (report_restriction_id),
  KEY fk_report_schedule_id (report_schedule_id),
  CONSTRAINT fk_report_schedule_has_report_restriction_report_restriction_id
    FOREIGN KEY (report_restriction_id)
    REFERENCES report_restriction (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_report_schedule_has_report_restriction_report_schedule_id
    FOREIGN KEY (report_schedule_id)
    REFERENCES report_schedule (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
