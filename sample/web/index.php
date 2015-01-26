<?php
/**
 * index.php
 * 
 * Main web script which drives the application.
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

// load web-script common code
require_once 'settings.ini.php';
require_once 'settings.local.ini.php';
require_once $SETTINGS['path']['CENOZO'].'/app/appointment.class.php';
$appointment = new \cenozo\appointment();
$appointment->execute();
