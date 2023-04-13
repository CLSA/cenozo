<?php
/**
 * bootstrap.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\business
 */

namespace cenozo;
use cenozo\lib, cenozo\log;

/**
 * This class is responsible for bootstrapping the application's restful api and web interface.
 */
final class bootstrap
{
  /**
   * Constructor.
   * 
   * @access public
   */
  public function __construct()
  {
    // WARNING!  Do not use the log class in this method!

    // set the method type, arguments and input file (if patching/posting)
    $this->method = array_key_exists( 'REQUEST_METHOD', $_SERVER ) ? $_SERVER['REQUEST_METHOD'] : NULL;
    $this->arguments = $_REQUEST;
    $util_class_name = lib::get_class_name( 'util' );
    if( 'true' === $util_class_name::get_header( 'No-Activity' ) )
      $this->no_activity = 'true' == $headers['No-Activity'];
    if( 'PATCH' == $this->method || 'POST' == $this->method )
      $this->file = file_get_contents( 'php://input' );
  }

  /**
   * Initialization
   * 
   * @param string $launch Either "ui" or "api"
   * @access public
   */
  public function initialize( $launch )
  {
    // WARNING!  Do not use the log class in this method!

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

    // setup
    ob_start();
    define( 'START_TIME', microtime( true ) );
    set_time_limit( 60 );
    ini_set( 'display_errors', '0' );
    error_reporting( E_ALL | E_STRICT );
    require_once dirname( __FILE__ ).'/initial.class.php';
    $initial = new initial;
    $this->settings = $initial->get_settings();

    ini_set( 'session.save_path', TEMPORARY_FILES_PATH );
    ini_set( 'session.gc_probability', 1 );
    ini_set( 'session.gc_divisor', 100 );
    ini_set( 'session.cookie_secure', false );
    ini_set( 'session.use_only_cookies', true );

    session_name( 'CENOZO_SESSID' );
    session_start();

    // include the autoloader and error code files (search for app_path::util first)
    require_once CENOZO_SRC_PATH.'/lib.class.php';
    require_once CENOZO_SRC_PATH.'/exception/error_codes.inc.php';
    if( file_exists( APP_SRC_PATH.'/exception/error_codes.inc.php' ) )
      require_once APP_SRC_PATH.'/exception/error_codes.inc.php';

    // registers an autoloader so classes don't have to be included manually
    lib::register( $this->method, $this->settings['general']['development_mode'] );

    // set up the logger and session
    lib::create( 'log' );
    $this->session = lib::create( 'business\session', $this->settings );

    // the session is initialized in the launch methods
    if( 'ui' == $launch ) $this->launch_ui();
    else if( 'api' == $launch ) $this->launch_api();
    else die(
      'The application is not set up properly.  Please check the launch type sent to the '.
      'initialize() method and make sure it is either "ui" or "api".' );

    $this->session->shutdown();
  }

  /**
   * Executes the request.
   * 
   * @access private
   */
  private function launch_ui()
  {
    $util_class_name = lib::get_class_name( 'util' );
    $ui = lib::create( 'ui\ui' );
    $error = NULL;

    try
    {
      // if we are maintenance mode then go no further
      if( !$this->settings['general']['maintenance_mode'] )
      {
        $this->session->initialize();

        // make sure the software and database versions match
        if( $this->settings['general']['version'] != $this->session->get_application()->version )
          throw lib::create( 'exception\runtime',
            sprintf(
              'The software version (%s) does not match the database version (%s).  The web application will '.
              'remain unavailable until this problem is corrected by an administrator.',
              $this->settings['general']['version'],
              $this->session->get_application()->version ),
            __METHOD__ );
      }
    }
    catch( exception\base_exception $e )
    {
      $error = array(
        'title' => strcasecmp( 'notice', $e->get_type() )
          ? 'Please Note:'
          : ucwords( $e->get_type() ).' Error!',
        'message' => 0 < strlen( $e->get_raw_message() )
          ? $e->get_raw_message()
          : 'There was a problem while trying to communicate with the server.'.
            'Please contact support for help with this error.',
        'code' => sprintf( '%s.%s', strtoupper( substr( $e->get_type(), 0, 1 ) ), $e->get_code() )
      );

      // log all but notice exceptions and "wrong URL" errors
      if( 'notice' != $e->get_type() &&
          !preg_match( '/Server name, ".*", is not found in the application/', $e->get_raw_message() ) )
      {
        log::error( sprintf(
          "When loading main UI:\n%s %s",
          ucwords( $e->get_type() ),
          $e->to_string( false )
        ) );
      }
    }
    catch( \Exception $e )
    {
      $error = array(
        'title' => 'System Error!',
        'message' => 0 < strlen( $e->getMessage() )
          ? $e->getMessage()
          : 'There was a problem while trying to communicate with the server.'.
            'Please contact support for help with this error.',
        'code' => $util_class_name::convert_number_to_code( SYSTEM_CENOZO_BASE_ERRNO )
      );

      if( class_exists( 'cenozo\log' ) )
      {
        log::error( sprintf(
          "When loading mainUI:\nLast minute %s",
          $e
        ) );
      }
    }

    ob_end_clean();
    print $ui->get_interface( $this->settings['general']['maintenance_mode'], $error );
  }

  /**
   * Executes the request.
   * 
   * @access private
   */
  private function launch_api()
  {
    $util_class_name = lib::get_class_name( 'util' );

    $service = NULL;
    $db = NULL;

    try
    {
      // if we are maintenance mode then go no further
      if( $this->settings['general']['maintenance_mode'] )
        throw lib::create( 'exception\notice',
          'Sorry, the system is currently offline for maintenance. '.
          'Please check with an administrator or try again at a later time.', __METHOD__ );

      $this->session->initialize( $this->no_activity );
      $db = $this->session->get_database();

      // set up the identification headers
      if( !is_null( $this->session->get_site() ) )
        header( sprintf( 'Site: %s', $util_class_name::json_encode( $this->session->get_site()->name ) ) );
      if( !is_null( $this->session->get_user() ) )
        header( sprintf( 'User: %s', $util_class_name::json_encode( $this->session->get_user()->name ) ) );
      if( !is_null( $this->session->get_role() ) )
        header( sprintf( 'Role: %s', $util_class_name::json_encode( $this->session->get_role()->name ) ) );

      // make sure the software and database versions match
      if( $this->settings['general']['version'] != $this->session->get_application()->version )
        throw lib::create( 'exception\notice',
          sprintf(
            'The software version (%s) does not match the database version (%s).  The api will '.
            'remain unavailable until this problem is corrected by an administrator.',
            $this->settings['general']['version'],
            $this->session->get_application()->version ),
          __METHOD__ );

      // create and process the service
      $service = lib::create(
        $this->get_service_class_name(),
        $this->path,
        $this->arguments,
        $this->file );

      // start transaction and process the service
      $db->start_transaction();
      $service->process();
      $status = $service->get_status();

      // if required then print the api address in the log
      if( $this->settings['general']['show_api_calls'] )
        log::info( sprintf( 'API call to %s:%s returned %s', $this->method, $this->path, $status->get_code() ) );
    }
    catch( exception\base_exception $e )
    {
      $status = !is_null( $service ) && !$service->may_continue()
              ? $service->get_status()
              : lib::create( 'service\status',
                  NOTICE__CENOZO_BOOTSTRAP__LAUNCH_API__ERRNO == $e->get_number() ? 503 : 500 );

      // The service's data may already be set to something which would have been returned had an error
      // not been encountered.  For this reason we should overwrite with the exception's error code
      if( !is_null( $service ) )
      {
        $service->set_data( $e->get_code().'' );
        $service->get_status()->set_location( NULL );
      }

      // log all but notice exceptions
      if( 'notice' != $e->get_type() )
      {
        log::error( sprintf(
          "For service \"%s:%s\":\n%s %s",
          $this->method,
          $this->path,
          ucwords( $e->get_type() ),
          $e->to_string( false )
        ) );
      }
    }
    catch( \Exception $e )
    {
      $status = lib::create( 'service\status', 500 );

      if( class_exists( 'cenozo\log' ) )
      {
        log::error( sprintf(
          "For service \"%s\":\nLast minute %s",
          $this->path,
          $e
        ) );
      }
    }

    // fail transactions on error
    if( !is_null( $db ) )
    {
      if( is_null( $service ) || !$service->may_continue() ) $db->fail_transaction();
      else $db->complete_transaction();
    }

    ob_end_clean();
    $status->send_headers();

    if( !is_null( $service ) )
    {
      foreach( $service->get_headers() as $name => $header ) header( sprintf( '%s: %s', $name, $header ) );

      // the encoded data may be an emptry string
      print $service->get_data();

      // close the services writelog, if needed
      $service->close_writelog();
    }
  }

  /**
   * Returns the name of the service class based on the request path
   * 
   * @return string
   * @access protected
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
      foreach( $url_parts as $index => $part )
        if( 0 == $index % 2 && 0 < strlen( $part ) ) $class_name .= sprintf( '\%s', $part );

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
   * Whether or not to note the user's access
   * @var boolean
   * @access private
   */
  private $no_activity = false;

  /**
   * The method of the request
   * @var string
   * @access private
   */
  private $method = NULL;

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
   * The file sent by PATCH/POST requests
   * @var string
   * @access private
   */
  private $file = NULL;
}
