SELECT "Creating new update_participant_last_event procedure" AS "";

DROP PROCEDURE IF EXISTS update_participant_last_event;

DELIMITER $$
CREATE PROCEDURE update_participant_last_event(IN proc_participant_id INT(10) UNSIGNED, IN proc_event_type_id INT(10) UNSIGNED)
BEGIN
  REPLACE INTO participant_last_event( participant_id, event_type_id, event_id )
  SELECT participant.id, event_type.id, event.id
  FROM participant
  CROSS JOIN event_type
  LEFT JOIN event ON participant.id = event.participant_id
  AND event_type.id = event.event_type_id
  AND event.datetime <=> (
    SELECT MAX( datetime )
    FROM event
    WHERE participant.id = event.participant_id
    AND event_type.id = event.event_type_id
    GROUP BY event.participant_id, event.event_type_id
    LIMIT 1
  )
  WHERE participant.id = proc_participant_id
  AND event_type.id = proc_event_type_id;
END$$

DELIMITER ;
