<?php
/**
 * log.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo;

/**
 * @category external
 */
require_once 'Log.php';

/**
 * log: handles all logging
 *
 * The log class is used to log to various outputs depending on the application's running mode.
 * There are several logging functions, each of which have their purpose.  Use this class as
 * follows:
 * <code>
 * log::err( "There is an error here." );
 * log::emerg( "The server is on fire!!" );
 * </code>
 */
final class log extends singleton
{
  /**
   * Constructor.
   * 
   * Since this class uses the singleton pattern the constructor is never called directly.  Instead
   * use the {@link self} method.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function __construct()
  {
    // reserve some memory for emergency purposes (in case we run out)
    if( is_null( static::$emergency_memory ) ) static::$emergency_memory = str_repeat( '*', 1024*1024 );

    $this->loggers['display'] = NULL;
    $this->loggers['file'] = NULL;

    $this->policy_list = array(
      PEAR_LOG_EMERG => array(
        'log' => true,
        'convert' => false,
        'label' => true,
        'backtrace' => true
      ),
      PEAR_LOG_ALERT => array(
        'log' => true,
        'convert' => false,
        'label' => true,
        'backtrace' => true
      ),
      PEAR_LOG_CRIT => array(
        'log' => true,
        'convert' => false,
        'label' => true,
        'backtrace' => true
      ),
      PEAR_LOG_ERR => array(
        'log' => true,
        'convert' => false,
        'label' => true,
        'backtrace' => true
      ),
      PEAR_LOG_WARNING => array(
        'log' => true,
        'convert' => false,
        'label' => true,
        'backtrace' => true
      ),
      PEAR_LOG_NOTICE => array(
        'log' => true,
        'convert' => false,
        'label' => true,
        'backtrace' => false
      ),
      PEAR_LOG_DEBUG => array(
        'log' => true,
        'convert' => true,
        'label' => false,
        'backtrace' => false
      ),
      PEAR_LOG_INFO => array(
        'log' => false,
        'convert' => true,
        'label' => false,
        'backtrace' => false
      ),
    );
  }

  /**
   * Logging method
   * 
   * This is the highest severity log.  It should be used to describe a major problem which needs
   * to be brought to administrators' attention ASAP (ie: use it sparingly).
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $message The message to log.
   * @static
   * @access public
   */
  public static function emerg( $message ) { self::self()->send( $message, PEAR_LOG_EMERG ); }

  /**
   * Logging method
   * 
   * This is the second highest severity log.  It should be used to describe a major problem which
   * needs to be brought to administrators' attention in the near future (ie: use it sparingly).
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $message The message to log.
   * @static
   * @access public
   */
  public static function alert( $message ) { self::self()->send( $message, PEAR_LOG_ALERT ); }

  /**
   * Logging method
   * 
   * Use this type of log when there is a problem that is more severe than a usual error, but not
   * severe enough to notify administrators.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $message The message to log.
   * @static
   * @access public
   */
  public static function crit( $message ) { self::self()->send( $message, PEAR_LOG_CRIT ); }

  /**
   * Logging method
   * 
   * Use this type of log when there is an error.  For very severe errors see {@link crit},
   * {@link alert} and {@link emerg}
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $message The message to log.
   * @static
   * @access public
   */
  public static function err( $message ) { self::self()->send( $message, PEAR_LOG_ERR ); }

  /**
   * Logging method
   * 
   * Use this type of log for warnings.  Something that could be an error, but may not be.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $message The message to log.
   * @static
   * @access public
   */
  public static function warning( $message ) { self::self()->send( $message, PEAR_LOG_WARNING ); }

  /**
   * Logging method
   * 
   * Use this type of log to make note of complicated procedures.  Similar to {@link debug} but
   * these should remain in the code after implementation is finished.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $message The message to log.
   * @static
   * @access public
   */
  public static function notice( $message ) { self::self()->send( $message, PEAR_LOG_NOTICE ); }

  /**
   * Logging method
   * 
   * Use this type of log to help debug a procedure.  After implementation is finished they should
   * be removed from the code.  For complicated procedures where it is helpful to keep debug logs
   * use {@link notice} instead.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $message The message to log.
   * @static
   * @access public
   */
  public static function debug( $message )
  {
    // if there is more than one argument then treat them all as an array
    $message = 1 < func_num_args() ? func_get_args() : $message;
    self::self()->send( $message, PEAR_LOG_DEBUG );
  }

  /**
   * Logging method
   * 
   * This type of log is special.  It is used to track activity performed by the application so
   * it can be audited at a later date.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $message The message to log.
   * @static
   * @access public
   */
  public static function info( $message ) { self::self()->send( $message, PEAR_LOG_INFO ); }

  /**
   * Logging method
   * 
   * This is a special convenience method that sends the results of a print_r call on the provided
   * variable as a debug log.
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $message The message to log.
   * @param int $type The PEAR Log type (PEAR_LOG_ERR, PEAR_LOG_WARNING, etc)
   * @access private
   */
  private function send( $message, $type )
  {
    // make sure we have a session
    $session_class_name = lib::get_class_name( 'business\session' );
    if( !class_exists( $session_class_name ) || !$session_class_name::exists() ) return;

    if( is_string( $message ) )
    { // replace cenozo and application path strings with something smaller
      /*
      $message = str_replace(
        array( CENOZO_PATH, APPLICATION_PATH ),
        array( 'cenozo', APPLICATION ),
        $message );
      */
    }
    else if( is_bool( $message ) )
    { // convert booleans to a string so that they display properly
      $message = $message ? 'true' : 'false';
    }

    // log to file
    if( $this->policy_list[$type]['log'] )
    {
      // convert the message
      if( $this->policy_list[$type]['convert'] ) $message = static::convert_message( $message );

      // add a label
      if( $this->policy_list[$type]['label'] ) $message = static::label_message( $message );

      // add the backtrace
      if( $this->policy_list[$type]['backtrace'] ) $message = static::backtrace_message( $message );

      // log major stuff to an error log
      $this->initialize_logger( 'file' );
      $this->loggers[ 'file' ]->log( preg_replace( '/\'?\n\'?/', "\n", $message )."\n", $type );
    }
  }

  /**
   * Converts a non-string message into a string.
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * Initialize loggers if and when they are needed.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $type The type of log ('err', 'warning', etc)
   * @throws exception\runtime
   * @access private
   */
  private function initialize_logger( $type )
  {
    if( 'display' == $type )
    {
      if( NULL == $this->loggers[ 'display' ] )
      {
        // display means html, so let's pretty up the output a bit
        $conf = array(
          'lineFormat' => '<font color=red>%3$s in</font> '.
                          '<font color=blue>%8$s::%7$s</font> '.
                          '<font color=red>(%6$s):</font>'."\n".
                          '%4$s',
          'timeFormat' => '%H:%M:%S',
          'error_prepend' => '<pre style="font-weight: bold; color: #B0B0B0; background: black">',
          'error_append' => '</pre>',
          'linebreak' => '',
          'rawText' => true );
        $this->loggers[ 'display' ] = \Log::singleton( 'display', '', '', $conf );
      }
    }
    else if( 'file' == $type )
    {
      if( NULL == $this->loggers[ 'file' ] )
      {
        $conf = array(
          'append' => true,
          'locking' => true,
          'timeFormat' => '%Y-%m-%d (%a) %H:%M:%S' );
        $this->loggers[ 'file' ] = \Log::singleton( 'file', LOG_FILE_PATH, '', $conf );
      }
    }
    else
    {
      throw lib::create( 'exception\runtime',
        'Unable to create invalid logger type "'.$type.'"', __METHOD__ );
    }
  }

  /**
   * Returns a string representation of a pear log level constant
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param int $constant a PEAR_LOG_* constant
   * @static
   * @access private
   */
  private static function log_level_to_string( $constant )
  {
    $string = '';

    if( PEAR_LOG_EMERG == $constant ) $string = 'emergency';
    else if( PEAR_LOG_ALERT == $constant ) $string = 'alert';
    else if( PEAR_LOG_CRIT == $constant ) $string = 'critical';
    else if( PEAR_LOG_ERR == $constant ) $string = 'error';
    else if( PEAR_LOG_WARNING == $constant ) $string = 'warning';
    else if( PEAR_LOG_NOTICE == $constant ) $string = 'notice';
    else if( PEAR_LOG_INFO == $constant ) $string = 'info';
    else if( PEAR_LOG_DEBUG == $constant ) $string = 'debug';
    else $string = 'unknown';

    return $string;
  }

  /**
   * A error handling function that uses the log class as the error handler
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\base_exception
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
      log::emerg( $message );

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
      log::err( $message );
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * An array containing all the PEAR Log objects used by the class.
   * @var array( Log )
   * @access private
   */
  private $loggers;

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
