SELECT "Dropping old age_group_id entries from export_column table" AS "";

CREATE TEMPORARY TABLE rerank
SELECT b.export_id, b.rank
FROM export_column as b
JOIN export_column as a ON b.export_id = a.export_id AND b.rank > a.rank
WHERE a.column_name = "age_group_id"
ORDER BY b.export_id, b.rank;

DELETE FROM export_column
WHERE column_name = "age_group_id";

UPDATE export_column
JOIN rerank USING( export_id, rank )
SET export_column.rank = export_column.rank-1;
