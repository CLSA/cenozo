-- -----------------------------------------------------
-- Operations
-- -----------------------------------------------------
SET AUTOCOMMIT=0;

-- access
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "access", "delete", true, "Removes access from the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "access", "list", true, "List system access entries." );

-- activity
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "activity", "list", true, "List system activity." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "activity", "chart", true, "Displays a chart describing system activity." );

-- address
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "address", "delete", true, "Removes a participant's address entry from the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "address", "edit", true, "Edits the details of a participant's address entry." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "address", "new", true, "Creates a new address entry for a participant." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "address", "add", true, "View a form for creating new address entry for a participant." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "address", "view", true, "View the details of a participant's particular address entry." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "address", "list", true, "Lists a participant's address entries." );

-- alternate
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "alternate", "delete", true, "Removes an alternate contact person from the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "alternate", "edit", true, "Edits an alternate contact person's details." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "alternate", "new", true, "Add a new alternate contact person to the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "alternate", "add", true, "View a form for creating a new alternate contact person." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "alternate", "view", true, "View an alternate contact person's details." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "alternate", "list", true, "List alternate contact persons in the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "alternate", "add_address", true, "A form to create a new address entry to add to an alternate contact person." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "alternate", "delete_address", true, "Remove an alternate contact person's address entry." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "alternate", "add_phone", true, "A form to create a new phone entry to add to an alternate contact person." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "alternate", "delete_phone", true, "Remove an alternate contact person's phone entry." );

-- availability
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "availability", "delete", true, "Removes a participant's availability entry from the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "availability", "edit", true, "Edits the details of a participant's availability entry." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "availability", "new", true, "Creates new availability entry for a participant." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "availability", "add", true, "View a form for creating new availability entry for a participant." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "availability", "view", true, "View the details of a participant's particular availability entry." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "availability", "list", true, "Lists a participant's availability entries." );

-- cohort
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "cohort", "delete", true, "Removes a cohort from the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "cohort", "edit", true, "Edits a cohort's details." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "cohort", "new", true, "Add a new cohort to the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "cohort", "add", true, "View a form for creating a new cohort." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "cohort", "view", true, "View a cohort's details." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "cohort", "list", true, "List cohorts in the system." );

-- consent
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "consent", "delete", true, "Removes a participant's consent entry from the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "consent", "edit", true, "Edits the details of a participant's consent entry." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "consent", "new", true, "Creates new consent entry for a participant." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "consent", "add", true, "View a form for creating new consent entry for a participant." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "consent", "view", true, "View the details of a participant's particular consent entry." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "consent", "list", true, "Lists a participant's consent entries." );

-- event
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "event", "delete", true, "Removes a participant's event entry from the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "event", "edit", true, "Edits the details of a participant's event entry." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "event", "new", true, "Creates new event entry for a participant." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "event", "add", true, "View a form for creating new event entry for a participant." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "event", "view", true, "View the details of a participant's particular event entry." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "event", "list", true, "Lists a participant's event entries." );

-- event_type
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "event_type", "view", true, "View the details of an event type." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "event_type", "list", true, "Lists event types." );

-- notes
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "note", "delete", true, "Removes a note from the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "note", "edit", true, "Edits the details of a note." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "note", "new", false, "Creates a new note." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "note", "list", false, "Displays a list of notes." );

-- participant
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "participant", "delete", true, "Removes a participant from the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "participant", "edit", true, "Edits a participant's details." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "participant", "new", true, "Add a new participant to the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "participant", "add", true, "View a form for creating a new participant." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "participant", "view", true, "View a participant's details." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "participant", "list", true, "List participants in the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "participant", "add_event", true, "A form to create a new event entry to add to a participant." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "participant", "delete_event", true, "Remove a participant's event entry." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "participant", "add_availability", true, "A form to create a new availability entry to add to a participant." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "participant", "delete_availability", true, "Remove a participant's availability entry." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "participant", "add_consent", true, "A form to create a new consent entry to add to a participant." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "participant", "delete_consent", true, "Remove a participant's consent entry." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "participant", "add_address", true, "A form to create a new address entry to add to a participant." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "participant", "delete_address", true, "Remove a participant's address entry." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "participant", "add_phone", true, "A form to create a new phone entry to add to a participant." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "participant", "delete_phone", true, "Remove a participant's phone entry." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "participant", "add_alternate", true, "A form to create a new alternate contact to add to a participant." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "participant", "delete_alternate", true, "Remove a participant's alternate contact." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "pull", "participant", "primary", true, "Retrieves base participant information." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "pull", "participant", "list", true, "Retrieves base information for a list of participant." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "pull", "participant", "list_alternate", true, "Retrieves a list of a participant's alternates." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "pull", "participant", "list_consent", true, "Retrieves a list of participant's consent information." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "participant", "site_reassign", true, "A form to mass reassign the preferred site of multiple participants at once." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "participant", "site_reassign", true, "Updates the preferred site of a group of participants." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "participant", "multinote", true, "A form to add a note to multiple participants at once." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "participant", "multinote", true, "Adds a note to a group of participants." );

-- phone
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "phone", "delete", true, "Removes a participant's phone entry from the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "phone", "edit", true, "Edits the details of a participant's phone entry." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "phone", "new", true, "Creates a new phone entry for a participant." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "phone", "add", true, "View a form for creating new phone entry for a participant." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "phone", "view", true, "View the details of a participant's particular phone entry." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "phone", "list", true, "Lists a participant's phone entries." );

-- quota
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "quota", "delete", true, "Removes a quota from the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "quota", "edit", true, "Edits a quota's details." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "quota", "new", true, "Add a new quota to the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "quota", "add", true, "View a form for creating a new quota." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "quota", "view", true, "View a quota's details." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "quota", "list", true, "List quotas in the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "quota", "chart", true, "Displays a chart describing the progress of participant quotas." );

-- report
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "participant", "report", true, "Set up a participant report." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "pull", "participant", "report", true, "Download a participant report." );

-- role
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

-- service
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "service", "delete", true, "Removes a service from the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "service", "edit", true, "Edits a service's details." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "service", "new", true, "Add a new service to the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "service", "add", true, "View a form for creating a new service." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "service", "view", true, "View a service's details." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "service", "list", true, "List services in the system." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "service", "add_cohort", true, "A form to add a cohort to a service." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "service", "new_cohort", true, "Add a cohort to a service." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "service", "delete_cohort", true, "Remove a service's cohort." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "service", "add_role", true, "A form to add a role to a service." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "service", "new_role", true, "Add a role to a service." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "service", "delete_role", true, "Remove a service's role." );

-- setting
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "push", "setting", "edit", true, "Edits a setting's details." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "setting", "view", true, "View a setting's details." );
INSERT INTO operation( type, subject, name, restricted, description )
VALUES( "widget", "setting", "list", true, "List settings in the system." );

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
VALUES( "pull", "user", "list", true, "Retrieves information on lists of users." );

COMMIT;
