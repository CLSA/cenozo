SELECT "Creating new enrollment table" AS "";

CREATE TABLE IF NOT EXISTS enrollment (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(512) NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_name (name ASC))
ENGINE = InnoDB;

INSERT IGNORE INTO enrollment ( name, description ) VALUES
("age range","People who fall outside of the age range criteria."),
("armed forces","People who are a member of the armed forces or are a veteran."),
("cognitively impaired","People who are cognitively impaired."),
("consent unavailable","People who fail to provide consent to participate."),
("deaf","People who are deaf."),
("deceased","People who are deceased."),
("duplicate","People who already exists under a different record."),
("enrollment closed","People who missed the enrollment cut-off date."),
("federal reserve","People whose residence is on a federal reserve."),
("institutionalized","People who are institutionalized."),
("language barrier","People who do not adequately speak a supported language."),
("noncompliant","People who are unable to comply with study policies."),
("not canadian","People who are not Canadian."),
("not interested","People who are not interested in participating."),
("not low education","People who were not enrolled because they have post secondary education."),
("other","People who are not enrolled for an undefined reason."),
("out of study area","People who do not live within a serviceable area."),
("unreachable","People who could not be reached.");
