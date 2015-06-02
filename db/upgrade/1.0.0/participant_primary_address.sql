SELECT "Replacing old participant_primary_address view" AS "";

CREATE OR REPLACE VIEW participant_primary_address AS
SELECT participant.id AS participant_id, address.id AS address_id
FROM address
JOIN participant ON address.person_id = participant.person_id
WHERE address.rank = (
  SELECT MIN( address2.rank )
  FROM address AS address2
  JOIN region ON address2.region_id = region.id
  -- Joining to region_site is used to exclude addresses which are not
  -- in region_site, actual linkage (and language) is irrelevant
  JOIN region_site ON region.id = region_site.region_id
  WHERE address2.active
  AND address.person_id = address2.person_id
  GROUP BY address2.person_id );
