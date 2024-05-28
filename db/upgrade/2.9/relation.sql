SELECT "Creating new relation table" AS "";

CREATE TABLE IF NOT EXISTS relation (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  primary_participant_id INT(10) UNSIGNED NOT NULL,
  participant_id INT(10) UNSIGNED NOT NULL,
  relation_type_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  INDEX fk_primary_participant_id (primary_participant_id ASC),
  INDEX fk_participant_id (participant_id ASC),
  INDEX fk_relation_type_id (relation_type_id ASC),
  UNIQUE INDEX uq_primary_participant_id_relation_type_id (primary_participant_id ASC, relation_type_id ASC),
  UNIQUE INDEX uq_participant_id (participant_id ASC),
  CONSTRAINT fk_relation_primary_participant_id
    FOREIGN KEY (primary_participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_relation_participant_id
    FOREIGN KEY (participant_id)
    REFERENCES participant (id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_relation_relation_type_id
    FOREIGN KEY (relation_type_id)
    REFERENCES relation_type (id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

DELIMITER $$

DROP TRIGGER IF EXISTS relation_BEFORE_INSERT$$
CREATE DEFINER = CURRENT_USER TRIGGER relation_BEFORE_INSERT BEFORE INSERT ON relation FOR EACH ROW
BEGIN
  SELECT primary_participant_id INTO @other_primary_participant_id FROM relation
  WHERE participant_id = NEW.primary_participant_id
  AND primary_participant_id != NEW.primary_participant_id;

  IF @other_primary_participant_id THEN
    SET @sql = CONCAT(
      "Cannot create record with primary_participant_id '",
      NEW.primary_participant_id,
      "' as this record already belongs to another primary participant '",
      @other_primary_participant_id,
      "'"
    );
    SIGNAL SQLSTATE '23000' SET MESSAGE_TEXT = @sql, MYSQL_ERRNO = 1062;
  END IF;
END$$

DELIMITER ;
