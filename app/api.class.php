<?php
/**
 * api.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\business
 * @filesource
 */

namespace cenozo;
use cenozo\lib, cenozo\log;

/**
 * This class is responsible for handling all requests to the application's restful api.
 * 
 * @package cenozo\business
 */
final class api
{
  /**
   * Constructor.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function __construct()
  {
    // WARNING!  When we construct the api we haven't finished setting up the system yet, so
    // don't use the log class in this method!

    // set the method type and request path
    $this->method = $_SERVER['REQUEST_METHOD'];

    // determine the arguments
    if( 'DELETE' == $this->method )
    {
    }
    else if( 'GET' == $this->method )
    {
      $this->arguments = $_GET;
    }
    else if( 'HEAD' == $this->method )
    {
    }
    else if( 'PATCH' == $this->method )
    {
      $this->arguments =  $_GET;
      $this->file = file_get_contents( 'php://input' );
    }
    else if( 'POST' == $this->method )
    {
      $this->arguments =  $_POST;
      $this->file = file_get_contents( 'php://input' );
    }
    else if( 'PUT' == $this->method )
    {
      $this->arguments = $_GET;
      $this->file = file_get_contents( 'php://input' );
    }

    // determine the request path
    if( array_key_exists( 'REDIRECT_URL', $_SERVER ) )
    {
      // remove the front part of the url so we are left with the request only
      $self_path = substr( $_SERVER['PHP_SELF'], 0, strrpos( $_SERVER['PHP_SELF'], '/' ) + 1 );
      $this->path = str_replace( $self_path, '', $_SERVER['REDIRECT_URL'] );

      // remove any slashes at the end of the path
      $this->path = rtrim( $this->path, '/' );
    }
    else // root document means no path
    {
      $this->path = '';
    }

    // turn on output buffering from here on out
    ob_start();
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
   * Executes the request.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function execute()
  {
    $_SESSION['time']['script_start_time'] = microtime( true );

    // set up error handling
    ini_set( 'display_errors', '0' );
    error_reporting( E_ALL | E_STRICT );

    // include the api's initialization settings
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

    // include the autoloader and error code files (search for app_path::util first)
    require_once CENOZO_API_PATH.'/lib.class.php';
    require_once CENOZO_API_PATH.'/exception/error_codes.inc.php';
    if( file_exists( API_PATH.'/exception/error_codes.inc.php' ) )
      require_once API_PATH.'/exception/error_codes.inc.php';

    // registers an autoloader so classes don't have to be included manually
    lib::register(
      $this->method,
      $this->settings['general']['development_mode'] );

    // set up the logger and session
    $util_class_name = lib::get_class_name( 'util' );
    lib::create( 'log' );
    $session = lib::create( 'business\session', $this->settings );

    $error_code = NULL;
    $service = NULL;

    // now initialize the session then determine and execute the operation
    try
    {
      // if we are maintenance mode then go no further
      if( $this->settings['general']['maintenance_mode'] )
        throw lib::create( 'exception\notice',
          'Sorry, the system is currently offline for maintenance. '.
          'Please check with an administrator or try again at a later time.', __METHOD__ );

      $session->initialize();

      // make sure the software and database versions match
      if( $this->settings['general']['version'] != $session->get_application()->version )
        throw lib::create( 'exception\notice',
          sprintf(
            'The software version (%s) does not match the database version (%s).  The api will '.
            'remain unavailable until this problem is corrected by an administrator.',
            $this->settings['general']['version'],
            $session->get_application()->version ),
          __METHOD__ );

      if( lib::in_development_mode() )
      {
        $time = microtime( true );
        $initialization_time = $time - $_SESSION['time']['script_start_time'];
      }

      // create and process the service
      $service = lib::create(
        $this->get_service_class_name(),
        $this->path,
        $this->arguments,
        $this->file );

      $service->process();
      $status = $service->get_status();

      if( lib::in_development_mode() ) $operation_time = microtime( true ) - $time;
    }
    catch( exception\base_exception $e )
    {
      $status = lib::create( 'service\status', 500 );
      $error_code = $e->get_code();
    
      // log all but notice exceptions
      if( 'notice' != $e->get_type() ) log::err( ucwords( $e->get_type() ).' '.$e );
    }
    catch( \Exception $e )
    {
      $status = lib::create( 'service\status', 500 );
      $error_code = class_exists( 'cenozo\util' )
                  ? $util_class_name::convert_number_to_code( SYSTEM_CENOZO_BASE_ERRNO )
                  : 0;
    
      if( class_exists( 'cenozo\log' ) ) log::err( 'Last minute '.$e );
    }
    
    // make sure to fail any active transaction
    if( $session->use_transaction() )
    {
      if( 500 == $status->get_code() ) $session->get_database()->fail_transaction();
      $session->get_database()->complete_transaction();
    }

    $session->set_error_code( $error_code );

    // show the profile if we are in development mode
    if( lib::in_development_mode() )
    {
      $profile = array();
      $profile['Elapsed Time'] = sprintf( '%0.3f', $util_class_name::get_elapsed_time() );
      if( isset( $initialization_time ) )
        $profile['Initialization Time'] = sprintf( '%0.3f', $initialization_time );
      if( isset( $operation_time ) )
        $profile['Operation Time'] = sprintf( '%0.3f', $operation_time );

      $profile['Database Profile Time'] = 0;
      $profile['Database Profile Breakdown'] = array();
      foreach( $session->get_database()->get_all( 'SHOW PROFILE', false ) as $row )
      {
        $profile['Database Profile'][$row['Status']] = $row['Duration'];
        $profile['Database Profile Time'] += $row['Duration'];
      }
      $profile['Database Profile Time'] = sprintf( '%0.3f', $profile['Database Profile Time'] );
      log::info( $profile );
    }

    // we can end output buffering now
    ob_end_clean();

    $status->send_headers();

    if( !is_null( $service ) && !is_null( $service->get_data() ) )
    {
      $json_output = $util_class_name::json_encode( $service->get_data() );
      header( 'Content-Type: application/json' );
      header( 'Content-Length: '.strlen( $json_output ) );
      print $json_output;
    }
  }

  /**
   * TODO: document
   */
  protected function get_service_class_name()
  {
    // class name is in the form: service\<COLLECTION1>\<METHOD>
    // class name is in the form: service\<COLLECTION1>\<COLLECTION2>\<METHOD>
    // class name is in the form: service\<COLLECTION1>\<COLLECTION2>\<COLLECTION3>\<METHOD> (etc)

    // loop through the path and append all collections (skipping resources)
    $class_name = 'service';

    $url_parts = explode( '/', $this->path );
    if( 0 < strlen( $this->path ) )
    {
      foreach( $url_parts as $index => $part )
        if( 0 == $index % 2 ) $class_name .= sprintf( '\%s', $part );
    }
    
    // If the method is GET and we have an odd number of url parts (ie: collection)
    // then change method to QUERY
    $effective_method = 'GET' == $this->method && 1 == count( $url_parts ) % 2
                      ? 'query'
                      : strtolower( $this->method );
    $class_name .= sprintf( '\%s', $effective_method );

    // return the generic class if the specific one doesn't exist
    if( !lib::class_exists( $class_name ) )
      $class_name = sprintf( 'service\\%s', $effective_method );

    return $class_name;
  }
  
  /**
   * Contains all initialization parameters.
   * @var array
   * @access private
   */
  private $settings = array();

  /**
   * The path of the request
   * @var string
   * @access private
   */
  private $path = NULL;

  /**
   * Contains the request variables.
   * @var array
   * @access private
   */
  private $arguments = NULL;

  /**
   * TODO: document
   */
  private $file = NULL;
}
