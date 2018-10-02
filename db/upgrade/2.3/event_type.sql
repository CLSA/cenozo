SELECT 'Removing defunct "completed decedent questionnaire" event-type' AS "";
DELETE FROM event_type WHERE name = "completed decedent questionnaire";

SELECT "Removing record_address from decedent started/finished event types" AS "";
UPDATE event_type SET record_address = 0 WHERE name = "finished (Master Decedent Questionnaire)";
