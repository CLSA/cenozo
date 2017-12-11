SELECT "Creating new update_participant_last_proxy procedure" AS "";

DROP procedure IF EXISTS update_participant_last_proxy;

DELIMITER $$

CREATE PROCEDURE update_participant_last_proxy (IN proc_participant_id INT(10) UNSIGNED)
BEGIN
  REPLACE INTO participant_last_proxy( participant_id, proxy_id )
  SELECT participant.id, proxy.id
  FROM participant
  LEFT JOIN proxy ON participant.id = proxy.participant_id
  AND proxy.datetime <=> (
    SELECT MAX( datetime )
    FROM proxy
    WHERE participant.id = proxy.participant_id
    GROUP BY proxy.participant_id
    LIMIT 1
  )
  WHERE participant.id = proc_participant_id;
END$$

DELIMITER ;
