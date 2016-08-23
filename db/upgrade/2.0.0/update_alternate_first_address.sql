SELECT "Creating new update_alternate_first_address procedure" AS "";

DROP PROCEDURE IF EXISTS update_alternate_first_address;

DELIMITER $$
CREATE PROCEDURE update_alternate_first_address(IN proc_alternate_id INT(10) UNSIGNED)
BEGIN
  REPLACE INTO alternate_first_address( alternate_id, address_id )
  SELECT alternate.id, address.id
  FROM alternate
  LEFT JOIN address ON alternate.id = address.alternate_id
  AND address.rank <=> (
    SELECT MIN( address.rank )
    FROM address
    WHERE address.active
    AND alternate.id = address.alternate_id
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
    GROUP BY address.alternate_id
  )
  WHERE alternate.id = proc_alternate_id;
END$$

DELIMITER ;
