DROP PROCEDURE IF EXISTS patch_person_note;
DELIMITER //
CREATE PROCEDURE patch_person_note()
  BEGIN

    SELECT "Replacing person_id column with alternate_id and participant_id columns and renaming person_note table to note" AS "";

    SET @test = (
      SELECT COUNT(*)
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = "person_note" );
    IF @test = 1 THEN
      -- rename table
      RENAME TABLE person_note TO note;

      -- add columns
      ALTER TABLE note
      ADD COLUMN alternate_id INT UNSIGNED NULL AFTER person_id,
      ADD COLUMN participant_id INT UNSIGNED NULL AFTER alternate_id,
      ADD INDEX fk_alternate_id (alternate_id ASC),
      ADD INDEX fk_participant_id (participant_id ASC),
      ADD CONSTRAINT fk_note_alternate_id
        FOREIGN KEY (alternate_id)
        REFERENCES alternate (id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION,
      ADD CONSTRAINT fk_note_participant_id
        FOREIGN KEY (participant_id)
        REFERENCES participant (id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION;

      -- fill in new columns
      UPDATE note
      LEFT JOIN participant USING( person_id )
      LEFT JOIN alternate USING( person_id )
      SET note.alternate_id = alternate.id,
          note.participant_id = participant.id;

      -- drop column
      ALTER TABLE note
      DROP FOREIGN KEY fk_participant_note_person,
      DROP INDEX fk_person_id,
      DROP COLUMN person_id;

      -- rename constraint
      ALTER TABLE note
      DROP FOREIGN KEY fk_person_note_user_id,
      ADD CONSTRAINT fk_note_user_id
        FOREIGN KEY (user_id)
        REFERENCES user (id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION;
    END IF;

  END //
DELIMITER ;

CALL patch_person_note();
DROP PROCEDURE IF EXISTS patch_person_note;
