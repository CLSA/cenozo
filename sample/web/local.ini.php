<?php
/**
 * cenozo.local.ini.php
 * 
 * Defines local initialization settings for cenozo, overriding default settings found in
 * cenozo.ini.php
 */

namespace cenozo;
global $SETTINGS;

// The name of the application (must be the same as the base namespace: it cannot have spaces)
$SETTINGS[ 'general' ][ 'application_name' ] = 'myapp';

// The file path to the application
$SETTINGS[ 'path' ][ 'CENOZO' ] = '/home/patrick/files/repositories/cenozo';
$SETTINGS[ 'path' ][ 'APPLICATION' ] = '/home/patrick/files/repositories/myapp';

// The path to the log file
$SETTINGS[ 'path' ][ 'LOG_FILE' ] = 'log';

// Whether or not to run the application in development mode
$SETTINGS[ 'general' ][ 'development_mode' ] = true;

// The database name, username and password
$SETTINGS[ 'db' ][ 'database' ] = 'patrick_sandbox';
$SETTINGS[ 'db' ][ 'username' ] = 'patrick';
$SETTINGS[ 'db' ][ 'password' ] = '1qaz2wsx';
$SETTINGS[ 'db' ][ 'prefix' ] = '';

// The LDAP base dn, username, password and whether LDAP is in active directory mode
$SETTINGS[ 'ldap' ][ 'base' ] = 'dc=clsadev,dc=rhpcs,dc=McMaster,dc=CA';
$SETTINGS[ 'ldap' ][ 'username' ] = 'cn=ebox,dc=clsadev,dc=rhpcs,dc=McMaster,dc=CA';
$SETTINGS[ 'ldap' ][ 'password' ] = 'zj+AH3ZeJ4YvN7IC';
$SETTINGS[ 'ldap' ][ 'active_directory' ] = true;

?>
