SELECT "Creating new exclusion table" AS "";

CREATE TABLE IF NOT EXISTS exclusion (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(512) NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_name (name ASC))
ENGINE = InnoDB;

INSERT IGNORE INTO exclusion ( name, description ) VALUES
("Age Range","People who fall outside of the age range criteria."),
("Armed Forces","People who are a member of the armed forces or are a veteran."),
("Cognitively Impaired","People who are cognitively impaired."),
("Consent Unavailable","People who fail to provide consent to participate."),
("Deaf","People who are deaf."),
("Deceased","People who are deceased."),
("Duplicate","People who already exists under a different record."),
("Exclusion Closed","People who missed the exclusion cut-off date."),
("Federal Reserve","People whose residence is on a federal reserve."),
("Institutionalized","People who are institutionalized."),
("Language Barrier","People who do not adequately speak a supported language."),
("Noncompliant","People who are unable to comply with study policies."),
("Not Canadian","People who are not Canadian."),
("Not Interested","People who are not interested in participating."),
("Not Low Education","People who were not enrolled because they have post secondary education."),
("Other","People who are not enrolled for an undefined reason."),
("Out of Study Area","People who do not live within a serviceable area."),
("Unreachable","People who could not be reached.");
