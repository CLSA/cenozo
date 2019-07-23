<?php
/**
 * status.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * Class used to describe http status responses
 */
class status extends \cenozo\base_object
{
  /**
   * Constructor
   * 
   * @param integer $code The HTTP response code
   * @link http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
   * @access public
   */
  public function __construct( $code )
  {
    $this->set_code( $code );
  }

  /**
   * Returns the status' current code
   * 
   * @link http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
   * @return integer
   * @access public
   */
  public function get_code()
  {
    return $this->code;
  }

  /**
   * Sets the status' response code
   * 
   * @param integer $code
   * @link http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
   * @access public
   */
  public function set_code( $code )
  {
    $util_class_name = lib::get_class_name( 'util' );

    // make sure the code is an integer
    if( !$util_class_name::string_matches_int( $code ) )
    {
      $this->code = 500;
      throw lib::create( 'exception\argument', 'code', $code, __METHOD__ );
    }

    $this->code = $code;

    if( DEVELOPMENT && 300 <= $this->code ) log::warning( sprintf( 'Setting status code to %d', $this->code ) );
  }

  /**
   * Sets the value to send as the location header
   * 
   * @param string $location
   * @access public
   */
  public function set_location( $location )
  {
    $this->location = $location;
  }

  /**
   * Returns the status message (code + code description)
   * 
   * @return string
   * @access public
   */
  public function get_message()
  {
    return array_key_exists( $this->code, static::$code_list ) ? static::$code_list[$this->code] : 'Unknown';
  }

  /**
   * Sends http headers using the status' message (code + code description) and the location header, if set
   * 
   * @access public
   */
  public function send_headers()
  {
    header( sprintf( 'HTTP/1.1 %s %s', $this->get_code(), $this->get_message() ) );
    if( $this->location ) header( sprintf( 'Location: %s', $this->location ) );
  }

  /**
   * The HTTP response code (must be one of the keys in the static $code_list array)
   * @var integer
   * @access protected
   */
  protected $code = NULL;

  /**
   * The location string to add to response headers (may be null)
   * @var string
   * @access protected
   */
  protected $location = NULL;

  /**
   * A list of all HTTP status codes
   * @var array( integer => string )
   * @access protected
   * @static
   */
  protected static $code_list = array(
    100 => 'Continue',
    101 => 'Switching Protocols',
    200 => 'OK',
    201 => 'Created',
    202 => 'Accepted',
    203 => 'Non-Authoritative Information',
    204 => 'No Content',
    205 => 'Reset Content',
    206 => 'Partial Content',
    300 => 'Multiple Choices',
    301 => 'Moved Permanently',
    302 => 'Found',
    303 => 'See Other',
    304 => 'Not Modified',
    305 => 'Use Proxy',
    306 => 'Notice', // custom cenozo usage
    307 => 'Temporary Redirect',
    400 => 'Bad Request',
    401 => 'Unauthorized',
    402 => 'Payment Required',
    403 => 'Forbidden',
    404 => 'Not Found',
    405 => 'Method Not Allowed',
    406 => 'Not Acceptable',
    407 => 'Proxy Authentication Required',
    408 => 'Request Timeout',
    409 => 'Conflict',
    410 => 'Gone',
    411 => 'Length Required',
    412 => 'Precondition Failed',
    413 => 'Request Entity Too Large',
    414 => 'Request-URI Too Long',
    415 => 'Unsupported Media Type',
    416 => 'Requested Range Not Satisfiable',
    417 => 'Expectation Failed',
    500 => 'Internal Server Error',
    501 => 'Not Implemented',
    502 => 'Bad Gateway',
    503 => 'Service Unavailable',
    504 => 'Gateway Timeout',
    505 => 'HTTP Version Not Supported' );
}
