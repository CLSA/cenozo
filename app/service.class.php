<?php
/**
 * service.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\business
 * @filesource
 */

namespace cenozo;
use cenozo\lib, cenozo\log;

/**
 * This class is responsible for handling all types of web-service requests to the application.
 * Based on the request url and method it responds differently, providing main, widget, pull and
 * push operations.
 * 
 * @package cenozo\business
 */
final class service
{
  /**
   * Constructor.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function __construct()
  {
    // WARNING!  When we construct the service we haven't finished setting up the system yet, so
    // don't use the log class in this method!

    // determine the arguments
    if( 'GET' == $_SERVER['REQUEST_METHOD'] && isset( $_GET ) ) $this->arguments = $_GET;
    else if( 'POST' == $_SERVER['REQUEST_METHOD'] && isset( $_POST ) ) $this->arguments = $_POST;

    // determine the service type
    if( array_key_exists( 'REDIRECT_URL', $_SERVER ) )
    {
      $base_self_path = substr( $_SERVER['PHP_SELF'], 0, strrpos( $_SERVER['PHP_SELF'], '/' ) + 1 );
      $this->base_url = str_replace( $base_self_path, '', $_SERVER['REDIRECT_URL'] );
      $this->url_tokens = explode( '/', $this->base_url );

      if( 'slot' == $this->url_tokens[0] ) $this->operation_type = 'widget';
      else $this->operation_type = 'GET' == $_SERVER['REQUEST_METHOD'] ? 'pull' : 'push';
    }
    else
    {
      $this->operation_type = 'main';
    }

    try
    {
      // determine the operation name
      if( 'widget' == $this->operation_type )
      {
        if( 3 > count( $this->url_tokens ) )
          throw new \Exception(
            sprintf( 'Invalid %s URL "%s".', $this->operation_type, $this->base_url ) );
        
        if( 5 <= count( $this->url_tokens ) ) 
          $this->operation_name = $this->url_tokens[3].'_'.$this->url_tokens[4];
      }
      else if( 'main' != $this->operation_type )
      {
        if( 2 > count( $this->url_tokens ) )
          throw new \Exception(
            sprintf( 'Invalid %s URL "%s".', $this->operation_type, $this->base_url ) );

        $this->operation_name = $this->url_tokens[0].'_'.$this->url_tokens[1];
      }
    }
    catch( \Exception $e )
    {
      // emulate a regular exception
      $result_array = array(
        'error_type' => 'Notice',
        'error_code' => 'URL',
        'error_message' => $e->getMessage() );

      // send the error in json format in an http error header
      $util_class_name = lib::get_class_name( 'util' );
      \HttpResponse::status( 400 );
      \HttpResponse::setContentType( 'application/json' );
      \HttpResponse::setData( $util_class_name::json_encode( $result_array ) );
      \HttpResponse::send();
      die;
    }

    // turn on output buffering for all but the main operation type
    if( 'main' != $this->operation_type ) ob_start();
  }
  
  /**
   * Executes the service.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function execute()
  {
    session_name( dirname( $_SERVER['SCRIPT_FILENAME'] ) );
    session_start();
    $_SESSION['time']['script_start_time'] = microtime( true );

    // set up error handling (error_reporting is also called in session's constructor)
    ini_set( 'display_errors', '0' );
    error_reporting( E_ALL | E_STRICT );

    // include the framework's initialization settings
    require_once( dirname( __FILE__ ).'/settings.ini.php' );
    $this->settings = $SETTINGS;

    if( !array_key_exists( 'general', $this->settings ) ||
        !array_key_exists( 'application_name', $this->settings['general'] ) )
      die( 'Error, application name not set!' );

    // make sure all paths are valid
    foreach( $SETTINGS['path'] as $key => $path )
      if( 'COOKIE' != $key &&
          'TEMP' != $key &&
          'TEMPLATE_CACHE' != $key &&
          'REPORT_CACHE' != $key &&
          !( is_null( $path ) || is_file( $path ) || is_link( $path ) || is_dir( $path ) ) )
        die( sprintf( 'Error, path for %s (%s) is invalid!', $key, $path ) );

    define( 'APPNAME', $this->settings['general']['application_name'] );
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

    if( 'main' == $this->operation_type ) $this->process_logout();

    // include the autoloader and error code files (search for app_path::util first)
    require_once CENOZO_API_PATH.'/lib.class.php';
    require_once CENOZO_API_PATH.'/exception/error_codes.inc.php';
    if( file_exists( API_PATH.'/exception/error_codes.inc.php' ) )
      require_once API_PATH.'/exception/error_codes.inc.php';

    // registers an autoloader so classes don't have to be included manually
    lib::register(
      $this->operation_type,
      $this->settings['general']['development_mode'] );

    // set up the logger and session
    $util_class_name = lib::get_class_name( 'util' );
    lib::create( 'log' );
    $session = lib::create( 'business\session', $this->settings );

    // now initialize the session then determine and execute the operation
    $result_array = array( 'success' => true );
    $output = array( 'name' => NULL, 'type' => NULL, 'data' => NULL );
    try
    {
      // if we are maintenance mode then go no further
      if( $this->settings['general']['maintenance_mode'] )
        throw lib::create( 'exception\notice',
          'Sorry, the system is currently offline for maintenance. '.
          'Please check with an administrator or try again at a later time.', __METHOD__ );

      // There are two special arguments which may request a specific site and role
      // If they exist, remove them from the arguments array and pass them to the session
      if( array_key_exists( 'request_site_name', $this->arguments ) &&
          array_key_exists( 'request_role_name', $this->arguments ) )
      {
        $session->initialize( $this->arguments['request_site_name'],
                              $this->arguments['request_role_name'] );
        unset( $this->arguments['request_site_name'] );
        unset( $this->arguments['request_role_name'] );
      }
      else $session->initialize();

      // execute service type-specific operations
      $method_name = $this->operation_type;
      $output = $this->$method_name();
    }
    catch( exception\base_exception $e )
    {
      $type = $e->get_type();
      $result_array['success'] = false;
      $result_array['error_type'] = ucfirst( $type );
      $result_array['error_code'] = $e->get_code();
      $result_array['error_message'] = $e->get_raw_message();
    
      // log all but notice exceptions
      if( 'notice' != $type ) log::err( ucwords( $type ).' '.$e );
    }
    catch( \Twig_Error $e )
    {
      $class_name = get_class( $e );
      if( 'Twig_Error_Syntax' == $class_name ) $code = 1;
      else if( 'Twig_Error_Runtime' == $class_name ) $code = 2;
      else if( 'Twig_Error_Loader' == $class_name ) $code = 3;
      else $code = 0;
    
      $code = $util_class_name::convert_number_to_code( TEMPLATE_CENOZO_BASE_ERRNO + $code );
      $result_array['success'] = false;
      $result_array['error_type'] = 'Template';
      $result_array['error_code'] = $code;
      $result_array['error_message'] = $e->getMessage();
    
      log::err( 'Template '.$e );
    }
    catch( \Exception $e )
    {
      $code = class_exists( 'cenozo\util' )
            ? $util_class_name::convert_number_to_code( SYSTEM_CENOZO_BASE_ERRNO )
            : 0;
      $result_array['success'] = false;
      $result_array['error_type'] = 'System';
      $result_array['error_code'] = $code;
      $result_array['error_message'] = $e->getMessage();
    
      if( class_exists( 'cenozo\log' ) ) log::err( 'Last minute '.$e );
    }
    
    // make sure to fail any active transaction
    if( $session->use_transaction() )
    {
      if( false == $result_array['success'] ) $session->get_database()->fail_transaction();
      $session->get_database()->complete_transaction();
    }

    $session->set_error_code(
      array_key_exists( 'error_code', $result_array ) ? $result_array['error_code'] : NULL );

    // we can end output buffering now
    if( 'main' != $this->operation_type ) ob_end_clean();

    // deal with the result of the operation (whether successful or not)
    if( true == $result_array['success'] )
    {
      if( 'push' == $this->operation_type )
      {
        $json_output = $util_class_name::json_encode( $result_array );
        header( 'Content-Type: application/json' );
        header( 'Content-Length: '.strlen( $json_output ) );
        print $json_output;
      }
      else if( 'pull' == $this->operation_type )
      {
        if( 'json' == $output['type'] )
        {
          $result_array['data'] = $output['data'];
          $json_output = $util_class_name::json_encode( $result_array );
          header( 'Content-Type: application/json' );
          header( 'Content-Length: '.strlen( $json_output ) );
          print $json_output;
        }
        else
        {
          header( 'Pragma: public');
          header( 'Expires: 0');
          header( 'Cache-Control: must-revalidate, post-check=0, pre-check=0' );
          header( 'Cache-Control: private', false );
          header( 'Content-Type: application/force-download' );
          header( 'Content-Type: application/octet-stream' );
          header( 'Content-Type: application/ms-excel' );
          header( 'Content-Disposition: attachment; filename='.
                  $output['name'].'.'.$output['type'] );
          header( 'Content-Transfer-Encoding: binary ' );
          header( 'Content-Length: '.strlen( $output['data'] ) );
          print $output['data'];
        }
      }
      else // 'main', 'widget'
      {
        print $output['data'];
      }
    }
    else
    {
      if( 'widget' == $this->operation_type ||
          'push' == $this->operation_type ||
          'pull' == $this->operation_type && ( !isset( $output['type'] ) || 'json' == $output['type'] ) )
      {
        $util_class_name::send_http_error( $util_class_name::json_encode( $result_array ) );
      }
      else
      {
        // Since the error may have been caused by the template engine, output using a php template
        include dirname( __FILE__ ).'/error.php';
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
      setcookie( 'slot__main__widget', NULL, time() - 3600, COOKIE_PATH );
      setcookie( 'slot__main__prev', NULL, time() - 3600, COOKIE_PATH );
      setcookie( 'slot__main__next', NULL, time() - 3600, COOKIE_PATH );
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
  
  // setup Twig
  private function render_template( $template, $variables )
  {
    $util_class_name = lib::get_class_name( 'util' );
    require_once 'Twig/Autoloader.php';
    \Twig_Autoloader::register();
  
    // set up the template engine
    $template_paths = array();
    if( file_exists( TPL_PATH ) ) $template_paths[] = TPL_PATH;
    $template_paths[] = CENOZO_TPL_PATH;
  
    $theme = lib::create( 'business\session' )->get_theme();
    $loader = new \Twig_Loader_Filesystem( $template_paths );
    $this->twig = new \Twig_Environment( $loader,
      array( 'debug' => lib::in_development_mode(),
             'strict_variables' => lib::in_development_mode(),
             'cache' => TEMPLATE_CACHE_PATH ) );
    $this->twig->addFilter( 'nl2br', new \Twig_Filter_Function( 'nl2br' ) );
    $this->twig->addFilter( 'ucwords', new \Twig_Filter_Function( 'ucwords' ) );
    $this->twig->addGlobal( 'FOREGROUND_COLOR', $util_class_name::get_foreground_color( $theme ) );
    $this->twig->addGlobal( 'BACKGROUND_COLOR', $util_class_name::get_background_color( $theme ) );

    $twig_template = $this->twig->loadTemplate( $template.'.twig' );
    return $twig_template->render( $variables );
  }

  /**
   * Creates the operation to be performed by the service request.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return ui\operation
   * @access private
   */
  private function create_operation()
  {
    $util_class_name = lib::get_class_name( 'util' );

    if( is_null( $this->operation_name ) )
      throw lib::create( 'exception\notice',
        'The system did not recognize your request, please refresh or restart your browser.',
        __METHOD__ );
      
    $class_name = sprintf( 'ui\%s\%s', $this->operation_type, $this->operation_name );
    $operation = lib::create( $class_name, $this->arguments );
    if( !is_subclass_of( $operation, 'cenozo\ui\\'.$this->operation_type ) )
      throw lib::create( 'exception\runtime',
        'Invoked operation "'.$class_name.'" is invalid.', __METHOD__ );

    $session = lib::create( 'business\session' );

    // Only register the operation if the operation is not a widget doing
    // anything other than loading
    if( !( 'widget' == $this->operation_type && 'load' != $this->url_tokens[2] ) )
      $session->set_operation( $operation, $this->arguments );

    // if requested to, start a transaction
    if( $session->use_transaction() ) $session->get_database()->start_transaction();

    return $operation;
  }      
  
  /**
   * Performs actions of the "main" type.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access private
   */
  private function main()
  {
    $class_name = lib::get_class_name( 'ui\main' );
    return array(
      'name' => NULL,
      'type' => 'html',
      'data' => $this->render_template( 'main', $class_name::get_variables() ) );
  }
    
  /**
   * Performs actions of the "pull" type.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access private
   */
  private function pull()
  {
    $operation = $this->create_operation();
    $operation->process();
    return array(
      'name' => $operation->get_file_name(),
      'type' => $operation->get_data_type(),
      'data' => $operation->get_data() );
  }

  /**
   * Performs actions of the "push" type.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access private
   */
  private function push()
  {
    $operation = $this->create_operation();
    $operation->process();
    return array(
      'name' => NULL,
      'type' => NULL,
      'data' => NULL );
  }

  /**
   * Performs actions of the "widget" type.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access private
   */
  private function widget()
  {
    $session = lib::create( 'business\session' );
    $slot_name = $this->url_tokens[1];
    $slot_action = $this->url_tokens[2];

    // determine which widget to render based on the GET variables
    $current_widget = $session->slot_current( $slot_name );

    // if we are loading the same widget as last time then merge the arguments
    if( !is_null( $current_widget ) &&
        is_array( $current_widget['args'] ) &&
        $this->operation_name == $current_widget['name'] )
    {
      // A simple array_merge call will not work since we may have a multi-dimensional array
      // so we have to go through each argument, add them if it isn't an array and merge it
      // if it is
      foreach( $current_widget['args'] as $key => $arg )
      {
        $this->arguments[$key] = is_array( $arg ) && array_key_exists( $key, $this->arguments )
                              ? array_merge( $arg, $this->arguments[$key] )
                              : $arg;
      }
    }

    // if the prev, next or refresh buttons were invoked, change the operation name appropriately
    if( 'prev' == $slot_action )
    {
      $prev_widget = $session->slot_prev( $slot_name );
      $this->operation_name = $prev_widget['name'];
      $this->arguments = $prev_widget['args'];
    }
    else if( 'next' == $slot_action )
    {
      $next_widget = $session->slot_next( $slot_name );
      $this->operation_name = $next_widget['name'];
      $this->arguments = $next_widget['args'];
    }
    else if( 'refresh' == $slot_action && !is_null( $current_widget ) )
    {
      $this->operation_name = $current_widget['name'];
      $this->arguments = $current_widget['args'];
    }

    $operation = $this->create_operation();
    $operation->process();
    
    // render the widget and report to the session
    $data = $this->render_template( $this->operation_name, $operation->get_variables() );

    // only push on load slot actions
    if( 'load' == $slot_action )
      $session->slot_push( $slot_name, $this->operation_name, $this->arguments );

    return array(
      'name' => NULL,
      'type' => 'html',
      'data' => $data );
  }

  /**
   * Contains all initialization parameters.
   * @var array
   * @access private
   */
  private $settings;

  /**
   * The base url of the service request.
   * @var string
   * @access private
   */
  private $base_url;

  /**
   * Contains the parts of the url that describe the service request.
   * @var array
   * @access private
   */
  private $url_tokens;

  /**
   * Contains the GET or POST variables.
   * @var array
   * @access private
   */
  private $arguments = NULL;

  /**
   * The type of the operation being performed
   * @var string
   * @access private
   */
  private $operation_type = NULL;

  /**
   * The name of the operation being performed (in <subject>_<name> format)
   * @var string
   * @access private
   */
  private $operation_name = NULL;

  /**
   * The twig class which renders templates.
   * @var \Twig_Environment
   * @access private
   */
  private $twig;
}
?>
