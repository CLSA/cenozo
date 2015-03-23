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
