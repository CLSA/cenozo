SELECT "Creating new update_participant_primary_address procedure" AS "";

DROP PROCEDURE IF EXISTS update_participant_primary_address;

DELIMITER $$
CREATE PROCEDURE update_participant_primary_address(IN proc_participant_id INT(10) UNSIGNED)
BEGIN
  REPLACE INTO participant_primary_address( participant_id, address_id )
  SELECT participant.id, address.id
  FROM participant
  LEFT JOIN address ON participant.id = address.participant_id
  AND address.rank <=> (
    SELECT MIN( address.rank )
    FROM address
    JOIN region ON address.region_id = region.id
    -- Joining to region_site is used to exclude addresses which are not
    -- in region_site, actual linkage (and language) is irrelevant
    JOIN region_site ON region.id = region_site.region_id
    WHERE address.active = true
    AND address.international = false
    AND address.region_id IS NOT NULL
    AND address.postcode IS NOT NULL
    AND participant.id = address.participant_id
    GROUP BY address.participant_id
  )
  WHERE participant.id = proc_participant_id;
END$$

DELIMITER ;
