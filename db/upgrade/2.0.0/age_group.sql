SELECT "Making sure no age_group's upper is equal to another's lower value" AS "";

UPDATE age_group
SET upper = upper-1
WHERE upper IN ( SELECT lower FROM ( SELECT lower FROM age_group ) AS temp );
