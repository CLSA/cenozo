SELECT "Creating new update_participant_last_hin procedure" AS "";

DROP procedure IF EXISTS update_participant_last_hin;

DELIMITER $$
CREATE PROCEDURE update_participant_last_hin(IN proc_participant_id INT(10) UNSIGNED)
BEGIN
  REPLACE INTO participant_last_hin( participant_id, hin_id )
  SELECT participant.id, hin.id
  FROM participant
  LEFT JOIN hin ON participant.id = hin.participant_id
  AND hin.datetime <=> (
    SELECT MAX( datetime )
    FROM hin
    WHERE participant.id = hin.participant_id
    GROUP BY hin.participant_id
    LIMIT 1
  )
  WHERE participant.id = proc_participant_id;
END$$

DELIMITER ;
