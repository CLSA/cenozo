SELECT "Converting state overview to hold_type overview" AS "";

UPDATE overview
SET name = "hold_type",
    title = "Hold Type",
    description = "Overview of hold types (participants in holds)."
WHERE name = "state";

INSERT IGNORE INTO overview
SET name = "tracing",
    title = "Tracing",
    description = "Tracing overview (participants who are missing contact information).";
