-- ----------------------------------------------------------------------------------------------------
-- This file has sample data for help with development.
-- It is highly recommended to not run this script for anything other than development purposes.
-- ----------------------------------------------------------------------------------------------------
SET AUTOCOMMIT=0;

INSERT INTO site( name, timezone ) VALUES
( 'Hamilton', 'Canada/Eastern' );

-- Creates default/sample users
INSERT INTO user( name, first_name, last_name ) VALUES
( 'patrick', 'P.', 'Emond' ),
( 'dean', 'D.', 'Inglis' );

-- Grants all roles to all sites to all users
INSERT INTO access ( user_id, role_id, site_id )
SELECT user.id AS user_id, role.id AS role_id, site.id AS site_id
FROM user, role, site;

COMMIT;
