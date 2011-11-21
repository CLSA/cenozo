<?php
/**
 * cenozo.inc.php
 * 
 * Functions and setup code required by all web scripts.
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */
namespace cenozo;
session_name( dirname( __FILE__ ) );
session_start();
$_SESSION['time']['script_start_time'] = microtime( true );

// set up error handling (error_reporting is also called in session's constructor)
ini_set( 'display_errors', '0' );
error_reporting( E_ALL | E_STRICT );

// Function to gracefully handle missing require_once files
function include_file( $file, $no_error = false )
{
  if( !file_exists( $file ) )
  {
    if( !$no_error )
    {
      throw new \Exception( "<pre>\n".
           "FATAL ERROR: Unable to find required file '$file'.\n".
           "Please check that paths in the cenozo ini are set correctly.\n".
           "</pre>\n" );
    }
    return;
  }
  include $file;
}

// load the default, then local settings, then define various settings
include_file( 'cenozo.ini.php' );
include_file( 'local.ini.php', true );

$SETTINGS[ 'path' ][ 'CENOZO_API' ] = $SETTINGS[ 'path' ][ 'CENOZO' ].'/api';
$SETTINGS[ 'path' ][ 'CENOZO_TPL' ] = $SETTINGS[ 'path' ][ 'CENOZO' ].'/tpl';

$SETTINGS[ 'path' ][ 'API' ] = $SETTINGS[ 'path' ][ 'APPLICATION' ].'/api';
$SETTINGS[ 'path' ][ 'TPL' ] = $SETTINGS[ 'path' ][ 'APPLICATION' ].'/tpl';

// the web directory cannot be extended
$SETTINGS[ 'path' ][ 'WEB' ] = $SETTINGS[ 'path' ][ 'CENOZO' ].'/web';

foreach( $SETTINGS[ 'path' ] as $path_name => $path_value ) define( $path_name.'_PATH', $path_value );
foreach( $SETTINGS[ 'url' ] as $path_name => $path_value ) define( $path_name.'_URL', $path_value );

// include the autoloader and error code files (search for appname::util first)
include_file(
  file_exists( API_PATH.'/util.class.php' ) ?
  API_PATH.'/util.class.php' :
  CENOZO_API_PATH.'/util.class.php' );

include_file( CENOZO_API_PATH.'/exception/error_codes.inc.php' );
include_file( API_PATH.'/exception/error_codes.inc.php', true );

// registers an autoloader so classes don't have to be included manually
util::register( $SETTINGS[ 'general' ][ 'application_name' ] );

// set up the logger and session
log::self();
$session = business\session::self( $SETTINGS );
$session->initialize();
?>
