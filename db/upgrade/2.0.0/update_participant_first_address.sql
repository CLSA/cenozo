SELECT "Creating new update_participant_first_address procedure" AS "";

DROP PROCEDURE IF EXISTS update_participant_first_address;

DELIMITER $$
CREATE PROCEDURE update_participant_first_address(IN proc_participant_id INT(10) UNSIGNED)
BEGIN
  REPLACE INTO participant_first_address( participant_id, address_id )
  SELECT participant.id, address.id
  FROM participant
  LEFT JOIN address ON participant.id = address.participant_id
  AND address.rank <=> (
    SELECT MIN( address.rank )
    FROM address
    WHERE address.active
    AND participant.id = address.participant_id
    AND CASE MONTH( CURRENT_DATE() )
      WHEN 1 THEN address.january
      WHEN 2 THEN address.february
      WHEN 3 THEN address.march
      WHEN 4 THEN address.april
      WHEN 5 THEN address.may
      WHEN 6 THEN address.june
      WHEN 7 THEN address.july
      WHEN 8 THEN address.august
      WHEN 9 THEN address.september
      WHEN 10 THEN address.october
      WHEN 11 THEN address.november
      WHEN 12 THEN address.december
      ELSE 0 END = 1
    GROUP BY address.participant_id
  )
  WHERE participant.id = proc_participant_id;
END$$

DELIMITER ;
