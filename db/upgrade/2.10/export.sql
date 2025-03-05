-- WARNING: This conversion will only work if all exports have ONE OR RESTRICTION OR LESS
-- We can get away with not implementing the more complicated conversion where more than one OR restriction exists
-- because (fortunately) none existed in production at the time this patch was run

SELECT "Modifying collection/is-in-collection columns and restrictions in exports" AS "";

-- delete all table=collection restrictions
DELETE FROM export_restriction WHERE table_name = "collection";


-- create a temporary table containing all exports with collection columns and counting their restricions
SET @subtype_rank = 0;
SET @last_export_id = NULL;
CREATE TEMPORARY TABLE export_with_collection
SELECT
  export_column.subtype,
  (@subtype_rank := IF(export.id = @last_export_id, @subtype_rank+1, 1)) new_rank,
  (@last_export_id := export.id) AS export_id,
  export_restriction.rank AS or_rank
FROM export
JOIN export_column ON export.id = export_column.export_id AND export_column.table_name = "collection"
LEFT JOIN export_restriction ON export.id = export_restriction.export_id AND export_restriction.logic = "or"
ORDER BY export.id, export_column.rank;

ALTER TABLE export_with_collection ADD INDEX dk_export_id (export_id);

CREATE TEMPORARY TABLE export_with_collection_total
SELECT export_id, COUNT(*) AS total
FROM export_with_collection
GROUP BY export_id;

ALTER TABLE export_with_collection_total ADD INDEX dk_export_id (export_id);


-- Add an is_in_collection restriction "yes" at the start of all logic=or restrictions
-- start by changing the existing "or" logic to "and" (it will be replaced by the new restriction below)
UPDATE export_restriction
JOIN export_with_collection USING( export_id )
SET export_restriction.logic = "and"
WHERE export_with_collection.or_rank IS NOT NULL
AND export_restriction.rank = export_with_collection.or_rank;

-- start by incrementing all logic=or restriction ranks by 1001 (to avoid collisions)
UPDATE export_restriction
JOIN export_with_collection USING( export_id )
SET export_restriction.rank = export_restriction.rank + 1001
WHERE export_with_collection.or_rank IS NOT NULL
AND export_restriction.rank >= export_with_collection.or_rank;

-- now remove the extra 1000
UPDATE export_restriction
JOIN export_with_collection USING( export_id )
SET export_restriction.rank = export_restriction.rank - 1000
WHERE export_with_collection.or_rank IS NOT NULL
AND export_restriction.rank >= export_with_collection.or_rank;

-- add all rank=or_rank is_in_collection restrictions
INSERT INTO export_restriction( export_id, table_name, subtype, column_name, rank, logic, test, value )
SELECT DISTINCT export_id, "auxiliary", subtype, "is_in_collection", or_rank, "or", "<=>", 1
FROM export_with_collection
WHERE export_with_collection.or_rank IS NOT NULL;


-- Now add an is_in_collection restriction for each subtype at the start of all exports in export_with_collection
-- start by incrementing all restriction ranks by 1000 (to avoid collisions) and the number of restrictions
UPDATE export_restriction
JOIN export_with_collection_total USING( export_id )
SET export_restriction.rank = export_restriction.rank + 1000 + total;

-- now remove the extra 1000
UPDATE export_restriction
JOIN export_with_collection USING( export_id )
SET export_restriction.rank = export_restriction.rank - 1000;

-- now add all new is_in_collection restrictions
INSERT INTO export_restriction( export_id, table_name, subtype, column_name, rank, logic, test, value )
SELECT DISTINCT export_id, "auxiliary", subtype, "is_in_collection", new_rank, "and", "<=>", 1
FROM export_with_collection;


-- finally, convert all table=collection export_columns to hidden is_in_collection columns
UPDATE export_column
SET table_name = "auxiliary", column_name = "is_in_collection", include = 0
WHERE table_name = "collection";
