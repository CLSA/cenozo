<?php
/**
 * cenozo.ini.php
 * 
 * Defines installation-specific initialization settings for cenozo.
 * When this file is loaded it overrides any settings found in the read-only settings.ini.php file.
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo
 */

$settings = array();

// when set to true all operations are disabled
$settings['general']['maintenance_mode'] = false;

// we need to declare the framework's working name
$settings['general']['framework_name'] = 'cenozo';

// the web url of the cenozo framework
$settings['url']['CENOZO'] = sprintf( 'http%s://%s/patrick/cenozo',
                                          'on' == $_SERVER["HTTPS"] ? 's' : '',
                                          $_SERVER["HTTP_HOST"] );

// the path and url of Limesurvey
$settings['path']['LIMESURVEY'] = '/home/patrick/public_html/limesurvey';
$settings['url']['LIMESURVEY'] = '../limesurvey';

// the credentials for the machine user
$settings['general']['machine_user'] = 'mastodon';
$settings['general']['machine_password'] = '1qaz2wsx';

// database settings (username and password are set in the application's settings)
$settings['db']['server'] = 'localhost';
$settings['db']['database_prefix'] = 'patrick_';
$settings['db']['table_prefix'] = '';

// ldap settings
$settings['ldap']['enabled'] = true;
$settings['ldap']['server'] = 'localhost';
$settings['ldap']['port'] = 389;
$settings['ldap']['base'] = 'dc=clsa-elcv,dc=CA';
$settings['ldap']['username'] = 'cn=admin,dc=clsa-elcv,dc=CA';
$settings['ldap']['password'] = 'mgyCzWfI1gWeclNBKnFy';
$settings['ldap']['active_directory'] = true;

// opal settings
$settings['opal']['enabled'] = true;
$settings['opal']['server'] = 'opal.clsa-elcv.ca';
$settings['opal']['port'] = 8843;
$settings['opal']['username'] = 'cenozo';
$settings['opal']['password'] = 'l0n6AGO9';

// the Asterisk AJAM url, username and password
$settings['voip']['enabled'] = false;
$settings['voip']['url'] = 'http://localhost:8088/mxml';
$settings['voip']['username'] = 'cenozo';
$settings['voip']['password'] = '1qaz2wsx';
$settings['voip']['prefix'] = '00';

// the base directory to write monitored calls
// (must be an absolute path that the asterisk server's user has access to)
$settings['path']['VOIP_MONITOR'] = '';
$settings['url']['VOIP_MONITOR'] = 'monitor';
