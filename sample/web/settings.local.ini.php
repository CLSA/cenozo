<?php
/**
 * cenozo.local.ini.php
 * 
 * Defines local initialization settings for cenozo, overriding default settings found in
 * cenozo.ini.php
 */

global $SETTINGS;

// The web url of the Cenozo framework
$SETTINGS['url']['CENOZO'] = sprintf( 'http%s://%s/web/path/to/cenozo',
                                          'on' == $_SERVER["HTTPS"] ? 's' : '',
                                          $_SERVER["HTTP_HOST"] );

// The file path to the application
$SETTINGS['path']['CENOZO'] = '/path/to/cenozo';
$SETTINGS['path']['APPLICATION'] = '/path/to/this/application';

// The path to the log file
$SETTINGS['path']['LOG_FILE'] = '/path/to/log/file';

// Whether or not to run the application in development mode
$SETTINGS['general']['development_mode'] = true;

// The database name, username and password
$SETTINGS['db']['database'] = 'put your database name here';
$SETTINGS['db']['username'] = 'put your database username here';
$SETTINGS['db']['password'] = 'put your database password here';
$SETTINGS['db']['prefix'] = 'put your table name prefix here';

// The LDAP base dn, username, password and whether LDAP is in active directory mode
// Uncomment the following to enable LDAP-based user authentication
//$SETTINGS['ldap']['enabled'] = true;
//$SETTINGS['ldap']['base'] = 'put the ldap base here';
//$SETTINGS['ldap']['username'] = 'put the ldap username here';
//$SETTINGS['ldap']['password'] = 'put the ldap password here';
//$SETTINGS['ldap']['active_directory'] = true;
?>
