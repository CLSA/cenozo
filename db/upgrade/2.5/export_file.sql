SELECT "Adding default value to progress column in export_file table" AS "";

ALTER TABLE export_file MODIFY progress FLOAT NOT NULL DEFAULT 0;
