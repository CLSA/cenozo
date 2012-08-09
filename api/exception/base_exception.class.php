<?php
/**
 * base_exception.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\exception;
use cenozo\lib, cenozo\log;

/**
 * base_exception: base exception class
 *
 * The base_exception class from which all other cenozo exceptions extend
 */
class base_exception extends \Exception
{
  /**
   * Constructor
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $message A message describing the exception.
   * @param string|int $context The exceptions context, either a function name or error code.
   * @param exception $previous The previous exception used for the exception chaining.
   * @access public
   */
  public function __construct( $message, $context, $previous = NULL )
  {
    $this->raw_message = $message;

    // determine the error number
    $code = 0;
    $constant_name = strtoupper( $this->get_type() ).'_CENOZO_BASE_ERRNO';
    $base_code = defined( $constant_name ) ? constant( $constant_name ) : 0;

    if( is_numeric( $context ) )
    { // pre-defined error code, add the type code to it
      $code = $base_code + $context;
    }
    else if( is_string( $context ) )
    {
      // in case this is a method name then we need to replace :: with __
      $context = str_replace( '::', '__', $context );

      // replace namespaces backslashes with underscores
      $context = str_replace( '\\', '_', $context );
      $constant_name = strtoupper( sprintf( '%s__%s__ERRNO',
                                   $this->get_type(),
                                   $context ) );
      $code = defined( $constant_name ) ? constant( $constant_name ) : $base_code;
    }
    
    $this->error_number_constant_name = $constant_name;
    parent::__construct( sprintf( "\n%s (%s):\n%s\n",
                                  $constant_name,
                                  $code,
                                  $this->raw_message ), $code, $previous );
  }
  
  /**
   * Returns the type of exception as a string.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_type() { return substr( strrchr( get_called_class(), '\\' ), 1 ); }

  /**
   * Get the exception as a string.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function to_string() { return $this->__toString(); }

  /**
   * Returns the exception's error number.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return int
   * @access public
   */
  public function get_number() { return $this->getCode(); }

  /**
   * Returns the exception's error code (the error number as an encoded string)
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_code()
  {
    $util_class_name = lib::get_class_name( 'util' );
    return $util_class_name::convert_number_to_code( $this->get_number() );
  }

  /**
   * Get the previous exception.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return \Exception
   * @access public
   */
  public function get_previous() { return $this->getPrevious(); }

  /**
  /**
   * Get the exception message.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_message() { return $this->getMessage(); }

  /**
   * Get the exception raw message (sub-string of message)
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_raw_message() { return $this->raw_message; }

  /**
   * Get the exception backtrace.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_backtrace() { return $this->getTraceAsString(); }

  /**
   * The name of the error number constant defining this widget
   * @var string
   * @access private
   */
  private $error_number_constant_name;

  /**
   * The exceptions raw message.
   * @var string
   * @access protected
   */
  private $raw_message;
}
?>
