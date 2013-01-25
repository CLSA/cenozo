<?php
/**
 * settings.ini.php
 * 
 * Defines local initialization settings for cenozo, overriding default settings found in
 * cenozo.ini.php
 */

global $SETTINGS;

// The name of the application (must be the same as the base namespace: it cannot have spaces)
$SETTINGS['general']['application_name'] = 'myapp';
$SETTINGS['general']['version'] = '1.0.0';

// Whether or not to run the application in development mode
$SETTINGS['general']['development_mode'] = false;
