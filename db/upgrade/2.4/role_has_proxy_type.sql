SELECT "Create new role_has_proxy_type table" AS "";

CREATE TABLE IF NOT EXISTS role_has_proxy_type (
  role_id INT UNSIGNED NOT NULL,
  proxy_type_id INT UNSIGNED NOT NULL,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  PRIMARY KEY (role_id, proxy_type_id),
  INDEX fk_proxy_type_id (proxy_type_id ASC),
  INDEX fk_role_id (role_id ASC),
  CONSTRAINT fk_role_has_proxy_type_role_id
    FOREIGN KEY (role_id)
    REFERENCES role (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_role_has_proxy_type_proxy_type_id
    FOREIGN KEY (proxy_type_id)
    REFERENCES proxy_type (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- grant the administrator role access to all proxy types
INSERT IGNORE INTO role_has_proxy_type( role_id, proxy_type_id )
SELECT role.id, proxy_type.id
FROM role, proxy_type
WHERE role.name = "administrator";

-- grant all interviewing roles access to the "contact required, central" proxy type
INSERT IGNORE INTO role_has_proxy_type( role_id, proxy_type_id )
SELECT role.id, proxy_type.id
FROM role, proxy_type
WHERE proxy_type.name = "contact required, central"
AND role.name IN(
  "coordinator", "curator", "helpline", "interviewer",
  "interviewer+", "operator", "operator+", "supervisor"
);
