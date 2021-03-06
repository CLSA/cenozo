DROP PROCEDURE IF EXISTS patch_alternate;
DELIMITER //
CREATE PROCEDURE patch_alternate()
  BEGIN

    SELECT COUNT(*) INTO @test
    FROM information_schema.TABLES
    WHERE table_schema = DATABASE()
    AND table_name = "alternate";

    IF 0 < @test THEN

      SELECT "Adding new language_id column to alternate table" AS "";

      SELECT COUNT(*) INTO @total
      FROM information_schema.COLUMNS
      WHERE table_schema = DATABASE()
      AND table_name = "alternate"
      AND column_name = "language_id";

      IF 0 = @total THEN
        ALTER TABLE alternate ADD COLUMN language_id INT(10) UNSIGNED NOT NULL AFTER participant_id;
        
        -- set the default language to whatever the participant's language is
        UPDATE alternate
        JOIN participant ON alternate.participant_id = participant.id
        SET alternate.language_id = participant.language_id;

        ALTER TABLE alternate ADD INDEX fk_language_id (language_id ASC);

        ALTER TABLE alternate
        ADD CONSTRAINT fk_alternate_language_id
          FOREIGN KEY (language_id)
          REFERENCES language (id)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION;
      END IF;

    END IF;

  END //
DELIMITER ;

CALL patch_alternate();
DROP PROCEDURE IF EXISTS patch_alternate;


DELIMITER $$

DROP TRIGGER IF EXISTS alternate_BEFORE_INSERT$$
CREATE DEFINER = CURRENT_USER TRIGGER alternate_BEFORE_INSERT BEFORE INSERT ON alternate FOR EACH ROW
BEGIN
  IF NOT NEW.language_id THEN
    SET NEW.language_id = ( SELECT language_id FROM participant WHERE id = NEW.participant_id );
  END IF;
END$$

DROP TRIGGER IF EXISTS alternate_AFTER_INSERT$$
CREATE DEFINER=CURRENT_USER TRIGGER alternate_AFTER_INSERT AFTER INSERT ON alternate FOR EACH ROW
BEGIN
  CALL update_alternate_first_address( NEW.id );
  CALL update_alternate_last_alternate_consents( NEW.id );
  CALL update_alternate_last_written_alternate_consents( NEW.id );
END$$

DELIMITER ;
