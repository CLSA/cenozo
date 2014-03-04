<?php
/**
 * cenozo.ini.php
 * 
 * Defines initialization settings for cenozo.
 * DO NOT edit this file, to override these settings use settings.local.ini.php instead.
 * When this file is loaded it only defines setting values if they are not already defined.
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo
 */

$settings = array();

// Framework software version (is never overridded by the application's ini file)
$settings['general']['cenozo_version'] = '0.2.6';

// When set to true all operations are disabled
$settings['general']['maintenance_mode'] = false;

// always leave as false when running as production server
$settings['general']['development_mode'] = false;

$settings['path']['COOKIE'] = substr( $_SERVER['SCRIPT_NAME'], 0, -9 );

// the location of cenozo internal path
$settings['path']['CENOZO'] = '/usr/local/lib/cenozo';

// the location of libraries
$settings['path']['ADODB'] = '/usr/local/lib/adodb';

// javascript and css paths
$settings['url']['JS'] = $this->settings['url']['CENOZO'].'/js';
$settings['url']['CSS'] = $this->settings['url']['CENOZO'].'/css';

// javascript libraries
$settings['version']['JQUERY'] = '1.10.2';
$settings['version']['JQUERY_UI'] = '1.10.4';

$settings['url']['JQUERY'] = '/jquery';
$settings['url']['JQUERY_UI'] =
  $settings['url']['JQUERY'].'/ui-'.$settings['version']['JQUERY_UI'];
$settings['url']['JQUERY_PLUGINS'] = $settings['url']['JQUERY'].'/plugins';
$settings['path']['JQUERY_UI_THEMES'] =
  '/var/www/jquery/ui-'.$settings['version']['JQUERY_UI'].'/css';

$settings['url']['JQUERY_JS'] = 
  $settings['url']['JQUERY'].'/jquery-'.$settings['version']['JQUERY'].'.min.js';
$settings['url']['JQUERY_UI_JS'] =
  $settings['url']['JQUERY_UI'].'/js/jquery-ui-'.
  $settings['version']['JQUERY_UI'].'.custom.min.js';

$settings['url']['JQUERY_LAYOUT_JS'] =
  $settings['url']['JQUERY_PLUGINS'].'/layout.js';
$settings['url']['JQUERY_COOKIE_JS'] =
  $settings['url']['JQUERY_PLUGINS'].'/cookie.js';
$settings['url']['JQUERY_HOVERINTENT_JS'] =
  $settings['url']['JQUERY_PLUGINS'].'/hoverIntent.js';
$settings['url']['JQUERY_FLIPTEXT_JS'] =
  $settings['url']['JQUERY_PLUGINS'].'/flipText.js';
$settings['url']['JQUERY_EXTRUDER_JS'] =
  $settings['url']['JQUERY_PLUGINS'].'/extruder.js';
$settings['url']['JQUERY_JEDITABLE_JS'] =
  $settings['url']['JQUERY_PLUGINS'].'/jeditable.js';
$settings['url']['JQUERY_TIMEPICKER_JS'] =
  $settings['url']['JQUERY_PLUGINS'].'/timepicker.js';
$settings['url']['JQUERY_RIGHTCLICK_JS'] =
  $settings['url']['JQUERY_PLUGINS'].'/rightClick.js';
$settings['url']['JQUERY_FULLCALENDAR_JS'] =
  $settings['url']['JQUERY_PLUGINS'].'/fullcalendar.js';
$settings['url']['JQUERY_FONTSCALE_JS'] =
  $settings['url']['JQUERY_PLUGINS'].'/fontscale.js';

// css files
$settings['url']['JQUERY_UI_THEMES'] = $settings['url']['JQUERY_UI'].'/css';
$settings['url']['JQUERY_FULLCALENDAR_CSS'] =
  $settings['url']['JQUERY_PLUGINS'].'/fullcalendar.css';

// the location of log files
$settings['path']['LOG_FILE'] = '/var/local/cenozo/log';

// the location of the template and report caches
$settings['path']['TEMP'] =
  '/tmp/'.$this->settings['general']['framework_name'].$this->settings['path']['APPLICATION'];
$settings['path']['TEMPLATE_CACHE'] = $settings['path']['TEMP'].'/template';
$settings['path']['REPORT_CACHE'] = $settings['path']['TEMP'].'/report';
$settings['path']['TEMPORARY_FILES'] = $settings['path']['TEMP'].'/files';

// database settings
$settings['db']['driver'] = 'mysql';
$settings['db']['server'] = 'localhost';
$settings['db']['database_prefix'] = '';
$settings['db']['prefix'] = '';

// ldap settings
$settings['ldap']['enabled'] = true;
$settings['ldap']['server'] = 'localhost';
$settings['ldap']['port'] = 389;
$settings['ldap']['base'] = '';
$settings['ldap']['username'] = '';
$settings['ldap']['password'] = '';
$settings['ldap']['active_directory'] = true;

// opal settings
$settings['opal']['enabled'] = false;
$settings['opal']['server'] = 'localhost';
$settings['opal']['port'] = 8843;
$settings['opal']['username'] = '';
$settings['opal']['password'] = '';

// themes
$settings['interface']['default_theme'] = 'smoothness';
