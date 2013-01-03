-- -----------------------------------------------------
-- Operations
-- -----------------------------------------------------
SET AUTOCOMMIT=0;

DELETE FROM operation;

-- access
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "access", "delete", true, "Removes access from the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "access", "list", true, "List system access entries." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "pull", "access", "primary", true, "Retrieves base access information." );

-- activity
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "activity", "list", true, "List system activity." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "pull", "activity", "primary", true, "Retrieves base activity information." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "activity", "chart", true, "Displays a chart describing system activity." );

-- notes
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "note", "delete", true, "Removes a note from the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "note", "edit", true, "Edits the details of a note." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "note", "new", false, "Creates a new note." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "note", "list", false, "Displays a list of notes." );

-- operation
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "operation", "list", true, "List operations in the system." );

-- role
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "role", "delete", true, "Removes a role from the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "role", "edit", true, "Edits a role's details." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "role", "new", true, "Add a new role to the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "role", "add", true, "View a form for creating a new role." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "role", "view", true, "View a role's details." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "role", "list", true, "List roles in the system." );

-- self
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "self", "home", false, "The current user's home screen." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "self", "menu", false, "The current user's main menu." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "self", "settings", false, "The current user's settings manager." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "self", "shortcuts", false, "The current user's shortcut icon set." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "self", "status", false, "The current user's status." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "self", "password", false, "Dialog for changing the user's password." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "self", "set_password", false, "Changes the user's password." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "self", "calculator", false, "A calculator widget." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "self", "timezone_calculator", false, "A timezone calculator widget." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "self", "set_site", false, "Change the current user's active site." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "self", "set_role", false, "Change the current user's active role." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "self", "set_theme", false, "Change the current user's web interface theme." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "pull", "self", "primary", false, "Retrieves the current user's information." );

-- setting
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "setting", "edit", true, "Edits a setting's details." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "setting", "view", true, "View a setting's details." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "setting", "list", true, "List settings in the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "pull", "setting", "primary", true, "Retrieves base setting information." );

-- site
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "site", "edit", true, "Edits a site's details." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "site", "new", true, "Add a new site to the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "site", "add", true, "View a form for creating a new site." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "site", "view", true, "View a site's details." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "site", "list", true, "List sites in the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "site", "add_access", true, "View users to grant access to the site." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "site", "new_access", true, "Grant access to a site." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "site", "delete_access", true, "Remove accesss from a site." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "pull", "site", "primary", true, "Retrieves base site information." );

-- system message
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "system_message", "delete", true, "Removes a system message from the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "system_message", "edit", true, "Edits a system message's details." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "system_message", "new", true, "Add a new system message to the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "system_message", "add", true, "View a form for creating a new system message." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "system_message", "view", true, "View a system message's details." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "system_message", "list", true, "List system messages in the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "pull", "system_message", "primary", true, "Retrieves base system message information." );

-- user
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "user", "delete", true, "Removes a user from the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "user", "edit", true, "Edits a user's details." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "user", "new", true, "Add a new user to the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "user", "add", true, "View a form for creating a new user." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "user", "view", true, "View a user's details." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "user", "list", true, "List users in the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "user", "add_access", true, "View sites to grant the user access to." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "user", "new_access", true, "Grant this user access to sites." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "user", "delete_access", true, "Removes this user's access to a site." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "user", "reset_password", true, "Resets a user's password." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "user", "set_password", true, "Sets a user's password." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "pull", "user", "primary", true, "Retrieves base user information." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "pull", "user", "list", true, "Retrieves information on lists of users." );

COMMIT;
