SELECT "Creating new update_alternate_first_address procedure" AS "";

DROP procedure IF EXISTS update_alternate_first_address;

DELIMITER $$
CREATE PROCEDURE update_alternate_first_address(IN proc_participant_id INT(10) UNSIGNED)
BEGIN
  SET @address_id = (
    SELECT address1.id
    FROM alternate
    LEFT JOIN address AS address1 ON alternate.id = address.alternate_id
    WHERE alternate.id = proc_alternate_id
    AND address1.rank <=> (
      SELECT MIN( address2.rank )
      FROM address AS address2
      WHERE address2.active
      AND alternate.id = address2.alternate_id
      AND CASE MONTH( CURRENT_DATE() )
        WHEN 1 THEN address2.january
        WHEN 2 THEN address2.february
        WHEN 3 THEN address2.march
        WHEN 4 THEN address2.april
        WHEN 5 THEN address2.may
        WHEN 6 THEN address2.june
        WHEN 7 THEN address2.july
        WHEN 8 THEN address2.august
        WHEN 9 THEN address2.september
        WHEN 10 THEN address2.october
        WHEN 11 THEN address2.november
        WHEN 12 THEN address2.december
        ELSE 0 END = 1
      GROUP BY address2.alternate_id
    )
  );

  IF @address_id THEN
    REPLACE INTO alternate_first_address
    SET alternate_id = proc_alternate_id, address_id = @address_id;
  ELSE
    DELETE FROM alternate_first_address
    WHERE alternate_id = proc_alternate_id;
  END IF;
END$$

DELIMITER ;
