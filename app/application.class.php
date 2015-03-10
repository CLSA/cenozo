<?php
/**
 * application.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\business
 * @filesource
 */

namespace cenozo;
use cenozo\lib, cenozo\log;

/**
 * This class is responsible for handling all types of web requests to the application.
 * Based on the request url and method it responds differently, providing main, widget, pull and
 * push operations.
 * 
 * @package cenozo\business
 */
final class application
{
  /**
   * Executes the request.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function execute()
  {
    session_name( dirname( $_SERVER['SCRIPT_FILENAME'] ) );
    session_start();

    // set up error handling (error_reporting is also called in session's constructor)
    ini_set( 'display_errors', '0' );
    error_reporting( E_ALL | E_STRICT );

    // include the application's initialization settings
    global $SETTINGS;
    $this->add_settings( $SETTINGS, true );
    unset( $SETTINGS );

    // include the framework's initialization settings
    require_once( dirname( __FILE__ ).'/settings.local.ini.php' );
    $this->add_settings( $settings );
    require_once( dirname( __FILE__ ).'/settings.ini.php' );
    $this->add_settings( $settings );

    if( !array_key_exists( 'general', $this->settings ) ||
        !array_key_exists( 'application_name', $this->settings['general'] ) )
      die( 'Error, application name not set!' );

    // make sure all paths are valid
    foreach( $this->settings['path'] as $key => $path )
    {
      if( 'TEMP' == $key )
      { // create the temp directory if it doesn't already exist
        if( !is_dir( $path ) ) mkdir( $path );
      }
      else if( false !== strpos( $path, $this->settings['path']['TEMP'] ) )
      { // create paths which are in the temp directory
        if( !is_dir( $path ) ) mkdir( $path );
      }
      else if( 'COOKIE' != $key &&
               'TEMPLATE_CACHE' != $key &&
               'REPORT_CACHE' != $key &&
               !( is_null( $path ) || is_file( $path ) || is_link( $path ) || is_dir( $path ) ) )
      {
        die( sprintf( 'Error, path for %s (%s) is invalid!', $key, $path ) );
      }
    }

    define( 'APPLICATION', $this->settings['general']['application_name'] );
    define( 'INSTANCE', $this->settings['general']['instance_name'] );
    $this->settings['path']['CENOZO_API'] = $this->settings['path']['CENOZO'].'/api';
    $this->settings['path']['CENOZO_TPL'] = $this->settings['path']['CENOZO'].'/tpl';

    $this->settings['path']['API'] = $this->settings['path']['APPLICATION'].'/api';
    $this->settings['path']['DOC'] = $this->settings['path']['APPLICATION'].'/doc';
    $this->settings['path']['TPL'] = $this->settings['path']['APPLICATION'].'/tpl';

    // the web directory cannot be extended
    $this->settings['path']['WEB'] = $this->settings['path']['CENOZO'].'/web';

    foreach( $this->settings['path'] as $path_name => $path_value )
      define( $path_name.'_PATH', $path_value );
    foreach( $this->settings['url'] as $path_name => $path_value )
      define( $path_name.'_URL', $path_value );

    $this->process_logout();

    // include the autoloader and error code files (search for app_path::util first)
    require_once CENOZO_API_PATH.'/lib.class.php';
    require_once CENOZO_API_PATH.'/exception/error_codes.inc.php';
    if( file_exists( API_PATH.'/exception/error_codes.inc.php' ) )
      require_once API_PATH.'/exception/error_codes.inc.php';

    // registers an autoloader so classes don't have to be included manually
    lib::register(
      'interface',
      $this->settings['general']['development_mode'] );

    // set up the logger and session
    $util_class_name = lib::get_class_name( 'util' );
    lib::create( 'log' );
    $session = lib::create( 'business\session', $this->settings );
    $session->initialize();

    // if we are maintenance mode then go no further
    if( $this->settings['general']['maintenance_mode'] )
      throw lib::create( 'exception\notice',
        'Sorry, the system is currently offline for maintenance. '.
        'Please check with an administrator or try again at a later time.', __METHOD__ );

    // make sure the software and database versions match
    if( $this->settings['general']['version'] != $session->get_application()->version )
      throw lib::create( 'exception\notice',
        sprintf(
          'The software version (%s) does not match the database version (%s).  The application will '.
          'remain unavailable until this problem is corrected by an administrator.',
          $this->settings['general']['version'],
          $session->get_application()->version ),
        __METHOD__ );
  }
  
  /**
   * Adds a list of key/value pairs to the settings
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $settings
   * @param boolean $replace Whether to replace the existing settings array
   * @access public
   */
  public function add_settings( $settings, $replace = false )
  {
    if( $replace )
    {
      $this->settings = $settings;
    }
    else
    {
      foreach( $settings as $category => $setting )
      {
        if( !array_key_exists( $category, $this->settings ) )
        {
          $this->settings[$category] = $setting;
        }
        else
        {
          foreach( $setting as $key => $value )
            if( !array_key_exists( $key, $this->settings[$category] ) )
              $this->settings[$category][$key] = $value;
        }
      }
    }
  }

  /**
   * Hack for logging out HTTP authentication.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access private
   */
  private function process_logout()
  {
    if( array_key_exists( 'logout', $_COOKIE ) && $_COOKIE['logout'] )
    {
      $_SESSION = array();
      session_destroy();
      session_write_close();
      setcookie( 'logout' );

      // force the user to log out by sending a header with invalid HTTP auth credentials
      header( sprintf( 'Location: %s://none:none@%s%s',
                       'http'.( 'on' == $_SERVER['HTTPS'] ? 's' : '' ),
                       $_SERVER['HTTP_HOST'],
                       $_SERVER['REQUEST_URI'] ) );
      exit;
    }
  }
  
  /**
   * Contains all initialization parameters.
   * @var array
   * @access private
   */
  private $settings = array();
}
