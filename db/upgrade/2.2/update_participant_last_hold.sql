SELECT "Creating new update_participant_last_hold procedure" AS "";

DROP procedure IF EXISTS update_participant_last_hold;

DELIMITER $$

CREATE PROCEDURE update_participant_last_hold (IN proc_participant_id INT(10) UNSIGNED)
BEGIN
  REPLACE INTO participant_last_hold( participant_id, hold_id )
  SELECT participant.id, hold.id
  FROM participant
  LEFT JOIN hold ON participant.id = hold.participant_id
  AND hold.datetime <=> (
    SELECT MAX( datetime )
    FROM hold
    WHERE participant.id = hold.participant_id
    GROUP BY hold.participant_id
    LIMIT 1
  )
  WHERE participant.id = proc_participant_id;
END$$

DELIMITER ;
