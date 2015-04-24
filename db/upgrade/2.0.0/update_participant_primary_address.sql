SELECT "Creating new update_participant_primary_address procedure" AS "";

DROP procedure IF EXISTS update_participant_primary_address;

DELIMITER $$

CREATE PROCEDURE update_participant_primary_address(IN proc_participant_id INT(10) UNSIGNED)
BEGIN

  REPLACE INTO participant_primary_address( participant_id, address_id )
  SELECT proc_participant_id, address1.id
  FROM address AS address1
  JOIN participant ON address1.person_id = participant.person_id
  WHERE participant.id = proc_participant_id
  AND address1.rank = (
    SELECT MIN( address2.rank )
    FROM address AS address2
    JOIN region ON address2.region_id = region.id
    -- Joining to region_site is used to exclude addresses which are not
    -- in region_site, actual linkage (and language) is irrelevant
    JOIN region_site ON region.id = region_site.region_id
    WHERE address2.active
    AND address1.person_id = address2.person_id
    GROUP BY address2.person_id
  );

END$$

DELIMITER ;
