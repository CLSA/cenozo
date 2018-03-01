<?php
/**
 * log.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo;

/**
 * log: handles all logging
 *
 * The log class is used to log to various outputs depending on the application's running mode.
 * There are several logging functions, each of which have their purpose.  Use this class as
 * follows:
 * <code>
 * log::error( "There is an error here." );
 * </code>
 */
final class log extends singleton
{
  /**
   * Constructor.
   * 
   * Since this class uses the singleton pattern the constructor is never called directly.  Instead
   * use the {@link self} method.
   * @access protected
   */
  protected function __construct()
  {
    // reserve some memory for emergency purposes (in case we run out)
    if( is_null( static::$emergency_memory ) ) static::$emergency_memory = str_repeat( '*', 1024*1024 );

    $this->policy_list = array(
      'critical' => array(
        'convert' => false,
        'label' => true,
        'backtrace' => true,
        'condensed' => false
      ),
      'error' => array(
        'convert' => false,
        'label' => true,
        'backtrace' => true,
        'condensed' => false
      ),
      'warning' => array(
        'convert' => false,
        'label' => true,
        'backtrace' => true,
        'condensed' => false
      ),
      'debug' => array(
        'convert' => true,
        'label' => false,
        'backtrace' => false,
        'condensed' => true
      ),
      'info' => array(
        'convert' => true,
        'label' => false,
        'backtrace' => false,
        'condensed' => true
      ),
    );
  }

  /**
   * Destructor.
   * 
   * @access public
   */
  public function __destruct()
  {
    if( !is_null( $this->log_file_handler ) )
    {
      if( false !== $this->log_file_handler ) fclose( $this->log_file_handler );
      $this->log_file_handler = NULL;
    }
  }

  /**
   * Logging method
   * 
   * Use this type of log when there is a problem that is more severe than a usual error, but not
   * severe enough to notify administrators.
   * @param string $message The message to log.
   * @static
   * @access public
   */
  public static function critical( $message ) { self::self()->send( $message, 'critical' ); }

  /**
   * Logging method
   * 
   * Use this type of log when there is an error.
   * @param string $message The message to log.
   * @static
   * @access public
   */
  public static function error( $message ) { self::self()->send( $message, 'error' ); }

  /**
   * Logging method
   * 
   * Use this type of log for warnings.  Something that could be an error, but may not be.
   * @param string $message The message to log.
   * @static
   * @access public
   */
  public static function warning( $message ) { self::self()->send( $message, 'warning' ); }

  /**
   * Logging method
   * 
   * Use this type of log to help debug a procedure.  After implementation is finished they should
   * be removed from the code.  For complicated procedures where it is helpful to keep debug logs
   * use {@link info} instead.
   * @param string $message The message to log.
   * @static
   * @access public
   */
  public static function debug( $message )
  {
    // if there is more than one argument then treat them all as an array
    $message = 1 < func_num_args() ? func_get_args() : $message;
    self::self()->send( $message, 'debug' );
  }

  /**
   * Logging method
   * 
   * This type of log is special.  It is used to track activity performed by the application so
   * it can be audited at a later date.
   * @param string $message The message to log.
   * @static
   * @access public
   */
  public static function info( $message ) { self::self()->send( $message, 'info' ); }

  /**
   * Logging method
   * 
   * This is a special convenience method that sends the results of a print_r call on the provided
   * variable as a debug log.
   * @param mixed $variable The variable to expand.
   * @param string $label The variable's label (leave false for no label)
   * @static
   * @access public
   */
  public static function print_r( $variable, $label = false )
  {
    $message = !is_bool( $variable )
             ? print_r( $variable, true )
             : ( $variable ? 'true' : 'false' ); // print_r doesn't display booleans
    self::debug( 'print_r'.( $label ? "($label)" : '' ).": $message" );
  }

  /**
   * Returns the backtrace as a log-friendly string.
   * 
   * @return string
   * @static
   * @access private
   */
  public static function backtrace()
  {
    $backtrace = "";
    $first = true;
    $index = 0;
    foreach( debug_backtrace( false ) as $trace )
    {
      // remove traces from the log class
      if( !array_key_exists( 'file', $trace ) || false === strpos( $trace['file'], 'log.class.php' ) )
      {
        $backtrace .= sprintf( '%s#%d', $first ? '' : "\n", $index++ );
        if( array_key_exists( 'file', $trace ) )
          $backtrace .= sprintf( ' %s(%d)', $trace['file'], $trace['line'] );
        if( array_key_exists( 'class', $trace ) )
          $backtrace .= sprintf( ' calling %s%s%s()', $trace['class'], $trace['type'], $trace['function'] );
        $first = false;
      }
    }
    return $backtrace;
  }

  /**
   * Master logging function.
   * 
   * @param string $message The message to log.
   * @param string $type One of "critical", "error", "warning", "debug", "info"
   * @access private
   */
  private function send( $message, $type )
  {
    // make sure we have a session
    $session_class_name = lib::get_class_name( 'business\session' );
    if( !class_exists( $session_class_name ) || !$session_class_name::exists() ) return;

    // convert booleans to a string so that they display properly
    if( is_bool( $message ) ) $message = $message ? 'true' : 'false';

    // process the message
    if( $this->policy_list[$type]['convert'] ) $message = static::convert_message( $message );
    if( $this->policy_list[$type]['label'] ) $message = static::label_message( $message );
    if( $this->policy_list[$type]['backtrace'] ) $message = static::backtrace_message( $message );

    // open the log file, lock it, write the message and unlock it
    $this->open_log_file();
    flock( $this->log_file_handler, LOCK_EX );
    fwrite(
      $this->log_file_handler,
      sprintf(
        "%s [%s] %s%s\n",
        strftime( '%Y-%m-%d (%a) %H:%M:%S' ),
        $type,
        preg_replace( '/\'?\n\'?/', "\n", $message ),
        $this->policy_list[$type]['condensed'] ? '' : "\n"
      )
    );
    flock( $this->log_file_handler, LOCK_UN );
  }

  /**
   * Converts a non-string message into a string.
   * @param mixed $message
   * @return string
   * @static
   * @access private
   */
  private static function convert_message( $message )
  {
    return !is_string( $message ) ? print_r( $message, true ) : $message;
  }

  /**
   * Labels a message with the user, role and site, automatically converting a non string message
   * to a string.
   * @param mixed $message
   * @return string
   * @static
   * @access private
   */
  private static function label_message( $message )
  {
    $message = static::convert_message( $message );

    $session = lib::create( 'business\session' );
    $db_user = $session->get_user();
    $db_role = $session->get_role();
    $db_site = $session->get_site();
    $user_and_role = is_null( $db_user ) || is_null( $db_role )
                   ? 'unknown'
                   : $db_user->name.':'.$db_role->name;
    $site = is_null( $db_site ) ? 'unknown' : $db_site->get_full_name();
    return sprintf( '<%s@%s> %s', $user_and_role, $site, $message );
  }

  /**
   * Adds a backtrace to a message, automatically converting a non string message to a string.
   * @param mixed $message
   * @return string
   * @static
   * @access private
   */
  private static function backtrace_message( $message )
  {
    $message = static::convert_message( $message );

    if( !preg_match( '/{main}$/', $message ) )
    {
      $backtrace = self::backtrace();
      $message .= strlen( $backtrace )
                ? "\nStack trace:\n".$backtrace
                : "\nNo stack trace available.";
    }

    return $message;
  }

  /**
   * Opens the log file for writing (or does nothing if it is already open)
   * @access private
   */
  private function open_log_file()
  {
    if( is_null( $this->log_file_handler ) )
    {
      $new = !file_exists( LOG_FILE_PATH );
      $this->log_file_handler = fopen( LOG_FILE_PATH, 'a' );
      if( false === $this->log_file_handler )
        die( sprintf( 'Error, unable to open log file "%s"', LOG_FILE_PATH ) );
      if( $new ) chmod( LOG_FILE_PATH, 0644 ); // set permissions if file is new
    }
  }

  /**
   * A error handling function that uses the log class as the error handler
   * @ignore
   */
  public static function error_handler( $level, $message, $file, $line )
  {
    $util_class_name = lib::get_class_name( 'util' );

    // ignore ldap errors
    if( 0 < preg_match( '/^ldap_[a-z_0-9]()/', $message ) ) return;

    $e = lib::create( 'exception\system', $message, $level );
    $message = sprintf( '(%s) : %s in %s on line %d',
                        $e->get_number(),
                        $message,
                        $file,
                        $line );
    if( E_PARSE == $level ||
        E_COMPILE_ERROR == $level ||
        E_USER_ERROR == $level ||
        E_CORE_ERROR == $level ||
        E_ERROR == $level )
    {
      log::critical( $message );

      // try and set the current operations error code, if possible
      $session_class_name = lib::get_class_name( 'business\session' );
      if( class_exists( $session_class_name ) && $session_class_name::exists() )
      {
        $session = lib::create( 'business\session' );

        // we need to complete the transaction if there is one in progress
        $db = $session->get_database();
        if( $db ) $db->fail_transaction();
      }

      $title = ucwords( $e->get_type() ).' Error!';
      $notice = 'There was a problem while trying to communicate with the server. '.
                'Please contact support for help with this error.';
      $code = $e->get_code();

      header( 'HTTP/1.1 500 Internal Server Error' );
      if( false === strpos( $_SERVER['REDIRECT_URL'], '/src' ) ) include CENOZO_PATH.'/src/ui/error.php';
      else print $e->get_code();
      exit;
    }
    else if( E_COMPILE_WARNING == $level ||
             E_CORE_WARNING == $level ||
             E_WARNING == $level ||
             E_USER_WARNING == $level ||
             E_STRICT == $level ||
             E_RECOVERABLE_ERROR == $level )
    {
      log::error( $message );
    }
    else if( E_NOTICE == $level ||
             E_USER_NOTICE == $level ||
             E_DEPRECATED == $level ||
             E_USER_DEPRECATED == $level )
    {
      log::warning( $message );
    }

    // from PHP docs:
    //   It is important to remember that the standard PHP error handler is completely bypassed for
    //   the error types specified by error_types unless the callback function returns FALSE.
    return false;
  }

  /**
   * A error handling function that uses the log class as the error handler
   * @ignore
   */
  public static function fatal_error_handler()
  {
    $error = error_get_last();

    if( $error ) 
    {
      static::$emergency_memory = NULL;
      log::error_handler( $error['type'], $error['message'], $error['file'], $error['line'] );
    }
  }

  /**
   * A handler to the log file
   * @var resource
   * @access private
   */
  private $log_file_handler = NULL;

  /**
   * An array containing the logging policy for all message types.
   * @var array
   * @access private
   */
  private $policy_list = array();

  /**
   * A reference to a block of memory that can be freed in the event of running out of memory
   * @var string
   * @access private
   * @static
   */
  private static $emergency_memory = NULL;
}

// define a custom error handlers
set_error_handler( array( '\cenozo\log', 'error_handler' ) );
register_shutdown_function( array( '\cenozo\log', 'fatal_error_handler' ) );
