SELECT "Creating new update_participant_last_trace procedure" AS "";

DROP procedure IF EXISTS update_participant_last_trace;

DELIMITER $$

CREATE PROCEDURE update_participant_last_trace (IN proc_participant_id INT(10) UNSIGNED)
BEGIN
  REPLACE INTO participant_last_trace( participant_id, trace_id )
  SELECT participant.id, trace.id
  FROM participant
  LEFT JOIN trace ON participant.id = trace.participant_id
  AND trace.datetime <=> (
    SELECT MAX( datetime )
    FROM trace
    WHERE participant.id = trace.participant_id
    GROUP BY trace.participant_id
    LIMIT 1
  )
  WHERE participant.id = proc_participant_id;
END$$

DELIMITER ;
