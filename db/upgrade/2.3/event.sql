DROP PROCEDURE IF EXISTS patch_event;
DELIMITER //
CREATE PROCEDURE patch_event()
  BEGIN

    SELECT 'Replacing "completed decedent questionnaire" with "finished (Master Decedent Questionnaire)" events' AS "";

    SELECT id INTO @old_event_type_id
    FROM event_type
    WHERE name = "completed decedent questionnaire";
    IF @old_event_type_id IS NOT NULL THEN
      SELECT id INTO @new_event_type_id
      FROM event_type
      WHERE name = "finished (Master Decedent Questionnaire)";

      UPDATE event SET event_type_id = @new_event_type_id WHERE event_type_id = @old_event_type_id;
    END IF;

  END //
DELIMITER ;

CALL patch_event();
DROP PROCEDURE IF EXISTS patch_event;
