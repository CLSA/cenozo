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

// the web url of the cenozo framework
$settings['url']['CENOZO'] = sprintf( 'http%s://%s/patrick/cenozo',
                                          'on' == $_SERVER["HTTPS"] ? 's' : '',
                                          $_SERVER["HTTP_HOST"] );

// the location of libraries
$settings['path']['ADODB'] = '/usr/local/lib/adodb';

// database settings (username and password are set in the application's settings)
$settings['db']['driver'] = 'mysql';
$settings['db']['server'] = 'localhost';
$settings['db']['database_prefix'] = 'patrick_';
$settings['db']['table_prefix'] = '';

// ldap settings
$settings['ldap']['enabled'] = true;
$settings['ldap']['server'] = 'localhost';
$settings['ldap']['port'] = 389;
$settings['ldap']['base'] = 'dc=clsadev,dc=rhpcs,dc=McMaster,dc=CA';
$settings['ldap']['username'] = 'cn=ebox,dc=clsadev,dc=rhpcs,dc=McMaster,dc=CA';
$settings['ldap']['password'] = 'zj+AH3ZeJ4YvN7IC';
$settings['ldap']['active_directory'] = true;
