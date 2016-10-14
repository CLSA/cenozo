SELECT "Creating new report_restriction table" AS "";

CREATE TABLE IF NOT EXISTS report_restriction (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  report_type_id INT UNSIGNED NOT NULL,
  rank INT NOT NULL,
  name VARCHAR(45) NOT NULL,
  title VARCHAR(45) NOT NULL,
  mandatory TINYINT(1) NOT NULL DEFAULT 0,
  null_allowed TINYINT(1) NOT NULL DEFAULT 0,
  restriction_type ENUM('table', 'uid_list', 'string', 'integer', 'decimal', 'date', 'datetime', 'time', 'boolean', 'enum') NOT NULL,
  custom TINYINT(1) NOT NULL DEFAULT 0,
  subject VARCHAR(45) NULL,
  operator ENUM('=', '<=>', '!=', '<>', '<', '<=', '>', '>=') NULL,
  enum_list VARCHAR(511) NULL,
  description TEXT NULL,
  PRIMARY KEY (id),
  INDEX fk_report_type_id (report_type_id ASC),
  UNIQUE INDEX uq_report_type_id_name (report_type_id ASC, name ASC),
  UNIQUE INDEX uq_report_type_id_rank (report_type_id ASC, rank ASC),
  CONSTRAINT fk_report_restriction_report_type_id
    FOREIGN KEY (report_type_id)
    REFERENCES report_type (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;

INSERT IGNORE INTO report_restriction (
  report_type_id, rank, name, title, mandatory,
  restriction_type, subject, operator, enum_list, description )
SELECT report_type.id, rank, restriction.name, restriction.title, mandatory,
       type, restriction.subject, operator, enum_list, restriction.description
FROM report_type, (
  SELECT
    1 AS rank,
    'uid_list' AS name,
    'Participant List' AS title,
    1 AS mandatory,
    'uid_list' AS type,
    NULL AS subject,
    NULL AS operator,
    NULL AS enum_list,
    'Provide a list of participant unique identifiers (UIDs) for which the report is to include.' AS description
  UNION SELECT
    2 AS rank,
    'collection' AS name,
    'Collection' AS title,
    0 AS mandatory,
    'table' AS type,
    'collection' AS subject,
    NULL AS operator,
    NULL AS enum_list,
    'Restrict to a particular collection.' AS description
) AS restriction
WHERE report_type.name = 'contact';

INSERT IGNORE INTO report_restriction (
  report_type_id, rank, name, title, mandatory,
  restriction_type, subject, operator, enum_list, description )
SELECT report_type.id, rank, restriction.name, restriction.title, mandatory,
       type, restriction.subject, operator, enum_list, restriction.description
FROM report_type, (
  SELECT
    1 AS rank,
    'collection' AS name,
    'Collection' AS title,
    0 AS mandatory,
    'table' AS type,
    'collection' AS subject,
    NULL AS operator,
    NULL AS enum_list,
    'Restrict to a particular collection.' AS description
  UNION SELECT
    2 AS rank,
    'language' AS name,
    'Language' AS title,
    0 AS mandatory,
    'table' AS type,
    'language' AS subject,
    NULL AS operator,
    NULL AS enum_list,
    'Restrict to a particular language.' AS description
  UNION SELECT
    3 AS rank,
    'start_date' AS name,
    'Start Date' AS title,
    0 AS mandatory,
    'date' AS type,
    'email_datetime' AS subject,
    '>=' AS operator,
    NULL AS enum_list,
    'Report changes starting on the given date.' AS description
  UNION SELECT
    4 AS rank,
    'end_date' AS name,
    'End Date' AS title,
    0 AS mandatory,
    'date' AS type,
    'email_datetime' AS subject,
    '<=' AS operator,
    NULL AS enum_list,
    'Report changes up to and including the given date.' AS description
) AS restriction
WHERE report_type.name = 'email';
