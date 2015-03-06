<?php
/**
 * settings.local.ini.php
 * 
 * Defines local initialization settings for the application, overriding default settings found in
 * settings.ini.php
 */

global $SETTINGS;

// whether or not to run the application in development mode
$SETTINGS['general']['development_mode'] = true;

// the file path to the application
$SETTINGS['path']['CENOZO'] = '/path/to/cenozo';
$SETTINGS['path']['APPLICATION'] = '/path/to/my_application';

// the path to the log file
$SETTINGS['path']['LOG_FILE'] = $SETTINGS['path']['APPLICATION'].'/log';

// database settings (the server and prefixes are set in the framework's settings)
$SETTINGS['db']['username'] = 'my_username';
$SETTINGS['db']['password'] = 'my_password';
