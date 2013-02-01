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

// when set to true all operations are disabled
$fwk_settings['general']['maintenance_mode'] = false;

// the web url of the cenozo framework
$fwk_settings['url']['CENOZO'] = sprintf( 'http%s://%s/patrick/cenozo',
                                          'on' == $_SERVER["HTTPS"] ? 's' : '',
                                          $_SERVER["HTTP_HOST"] );

// the location of libraries
$fwk_settings['path']['ADODB'] = '/usr/local/lib/adodb';

// database settings (username and password are set in the application's settings)
$fwk_settings['db']['driver'] = 'mysql';
$fwk_settings['db']['server'] = 'localhost';
$fwk_settings['db']['database_prefix'] = 'patrick_';
$fwk_settings['db']['table_prefix'] = '';

// ldap settings
$fwk_settings['ldap']['enabled'] = true;
$fwk_settings['ldap']['server'] = 'localhost';
$fwk_settings['ldap']['port'] = 389;
$fwk_settings['ldap']['base'] = 'dc=clsadev,dc=rhpcs,dc=McMaster,dc=CA';
$fwk_settings['ldap']['username'] = 'cn=ebox,dc=clsadev,dc=rhpcs,dc=McMaster,dc=CA';
$fwk_settings['ldap']['password'] = 'zj+AH3ZeJ4YvN7IC';
$fwk_settings['ldap']['active_directory'] = true;
