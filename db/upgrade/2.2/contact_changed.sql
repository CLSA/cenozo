SELECT "Creating new contact_changed procedure" AS "";

DROP procedure IF EXISTS contact_changed;

DELIMITER $$
CREATE PROCEDURE contact_changed (IN proc_participant_id INT(10) UNSIGNED)
BEGIN
  IF proc_participant_id IS NOT NULL THEN
    SELECT trace_type.name, IF( address.id IS NULL, 0, COUNT(*) )
    INTO @trace_type, @address_count
    FROM participant
    JOIN participant_last_trace ON participant.id = participant_last_trace.participant_id
    LEFT JOIN trace ON participant_last_trace.trace_id = trace.id
    LEFT JOIN trace_type ON trace.trace_type_id = trace_type.id
    LEFT JOIN address ON participant.id = address.participant_id AND address.active = 1
    WHERE participant.id = proc_participant_id;

    SELECT IF( phone.id IS NULL, 0, COUNT(*) )
    INTO @phone_count
    FROM participant
    LEFT JOIN phone ON participant.id = phone.participant_id AND phone.active = 1
    WHERE participant.id = proc_participant_id;

    IF 0 = @address_count OR 0 = @phone_count THEN
      IF @trace_type IS NULL THEN
        INSERT INTO trace( participant_id, trace_type_id, datetime, note )
        SELECT proc_participant_id, trace_type.id, UTC_TIMESTAMP(),
               "Automatically added after address or phone changed."
        FROM trace_type
        WHERE name = "site";
      END IF;
    ELSE
      IF @trace_type IS NOT NULL THEN
        INSERT INTO trace( participant_id, trace_type_id, datetime, note )
        VALUES( proc_participant_id, NULL, UTC_TIMESTAMP(),
                "Automatically added after address or phone changed." );
      END IF;
    END IF;
  END IF;
END$$

DELIMITER ;
