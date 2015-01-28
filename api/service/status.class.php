<?php
/**
 * status.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * Class used to describe http status responses
 */
class status extends \cenozo\base_object
{
  /**
   * TODO: document
   */
  public function __construct( $code )
  {
    $this->set_code( $code );
  }
  
  /**
   * TODO: document
   */
  public function get_code()
  {
    return $this->code;
  }

  /**
   * TODO: document
   */
  public function set_code( $code )
  {
    $util_class_name = lib::get_class_name( 'util' );

    // make sure the code is an integer
    if( !$util_class_name::string_matches_int( $code ) )
      throw lib::create( 'exception\argument', 'code', $code, __METHOD__ );

    $this->code = $code;
  }

  /**
   * TODO: document
   */
  public function get_message()
  {
    $message = 'Unknown';
    if( 200 == $this->code ) $message = 'OK';
    else if( 201 == $this->code ) $message = 'Created';
    else if( 202 == $this->code ) $message = 'Accepted';
    else if( 204 == $this->code ) $message = 'No Content';
    else if( 404 == $this->code ) $message = 'Not Found';
    else if( 405 == $this->code ) $message = 'Method Not Allowed';
    else if( 500 == $this->code ) $message = 'Internal Server Error';
    else if( 501 == $this->code ) $message = 'Not Implemented';

    return $message;
  }

  /**
   * TODO: document
   */
  public function send_headers()
  {
    header( sprintf( 'HTTP/1.1 %s %s', $this->get_code(), $this->get_message() ) );
  }

  /**
   * TODO: document
   */
  protected $code;
}
