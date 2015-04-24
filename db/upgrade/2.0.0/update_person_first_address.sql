SELECT "Creating new update_person_first_address procedure" AS "";

DROP procedure IF EXISTS update_person_first_address;

DELIMITER $$

CREATE PROCEDURE update_person_first_address(IN proc_person_id INT(10) UNSIGNED)
BEGIN

  SET @address_id = (
    SELECT address1.id
    FROM address AS address1
    WHERE person_id = proc_person_id
    AND address1.rank = (
      SELECT MIN( address2.rank )
      FROM address AS address2
      WHERE address2.active
      AND address1.person_id = address2.person_id
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
      GROUP BY address2.person_id
    )
  );
  
  IF @address_id THEN
    REPLACE INTO person_first_address
    SET person_id = proc_person_id, address_id = @address_id;
  ELSE
    DELETE FROM person_first_address
    WHERE person_id = proc_person_id;
  END IF;

END$$

DELIMITER ;
