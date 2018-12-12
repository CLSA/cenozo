SELECT "Advancing consent datetimes by 12 hours when time is set to midnight (so day shows correctly when converting from UTC)" AS "";

UPDATE consent
SET datetime = datetime + INTERVAL 12 HOUR
WHERE datetime LIKE "% 00:00:00";
