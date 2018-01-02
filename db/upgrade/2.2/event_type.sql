SELECT "Removing release event-types for applications which are not release based" AS "";

CREATE TEMPORARY TABLE remove_event_type
SELECT release_event_type_id AS id
FROM application
WHERE release_based = 0;

UPDATE application SET release_event_type_id = NULL WHERE release_based = 0;

DELETE FROM event_type
WHERE id IN( SELECT id FROM remove_event_type );
