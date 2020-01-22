SELECT "Adding default value to written column in consent table" AS "";

ALTER TABLE consent MODIFY written TINYINT(1) NOT NULL DEFAULT 0;
