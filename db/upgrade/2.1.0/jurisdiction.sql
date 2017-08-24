SELECT "Removing defunct triggers from jurisdiction table" AS "";

DROP TRIGGER IF EXISTS jurisdiction_BEFORE_INSERT;
DROP TRIGGER IF EXISTS jurisdiction_BEFORE_UPDATE;
