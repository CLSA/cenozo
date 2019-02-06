SELECT "Changing withdraw by 3rd party to a final hold" AS "";

UPDATE hold_type SET type = "final" WHERE name = "Withdrawn by 3rd party";
