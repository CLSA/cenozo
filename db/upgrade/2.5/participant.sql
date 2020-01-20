SELECT "Adding default value to honorific column in participant table" AS "";

ALTER TABLE participant MODIFY honorific VARCHAR(10) NOT NULL DEFAULT '';
