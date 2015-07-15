-- Script used to remove a site BEFORE converting to cenozo 2.0
-- NOTE: this script is not run by patch_database.sql, instead you should alter and run it yourself
--       if you wish to remove a site from your system before upgrading

DELETE FROM access WHERE site_id = ( SELECT id FROM site WHERE name = "DEFUNCT_SITE_NAME" );

DELETE FROM sabretooth.phone_call WHERE assignment_id IN (
  SELECT id FROM sabretooth.assignment WHERE site_id = ( SELECT id FROM site WHERE name = "DEFUNCT_SITE_NAME" )
);
DELETE FROM sabretooth.appointment WHERE assignment_id IN (
  SELECT id FROM sabretooth.assignment WHERE site_id = ( SELECT id FROM site WHERE name = "DEFUNCT_SITE_NAME" )
);
DELETE FROM sabretooth.assignment WHERE site_id = ( SELECT id FROM site WHERE name = "DEFUNCT_SITE_NAME" );
DELETE FROM sabretooth.away_time WHERE site_id = ( SELECT id FROM site WHERE name = "DEFUNCT_SITE_NAME" );
DELETE FROM sabretooth.shift WHERE site_id = ( SELECT id FROM site WHERE name = "DEFUNCT_SITE_NAME" );
DELETE FROM sabretooth.shift_template WHERE site_id = ( SELECT id FROM site WHERE name = "DEFUNCT_SITE_NAME" );
DELETE FROM sabretooth.setting_value WHERE site_id = ( SELECT id FROM site WHERE name = "DEFUNCT_SITE_NAME" );
DELETE FROM site WHERE name = "DEFUNCT_SITE_NAME";
