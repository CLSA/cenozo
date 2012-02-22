<?php
/**
 * cenozo_manager.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\business
 * @filesource
 */

namespace cenozo\business;
use cenozo\lib, cenozo\log;

/**
 * Manages communication with other cenozo services.
 * 
 * @package cenozo\business
 */
class cenozo_manager extends \cenozo\factory
{
  /**
   * Constructor.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function __construct( $arguments )
  {
    // determine whether connecting to cenozo service is enabled
    $url = $arguments[0];
    $this->enabled = !is_null( $url );

    if( $this->enabled )
    {
      $base_url = $url.'/';
      $base_url = preg_replace(
        '#://#', '://'.$_SERVER['PHP_AUTH_USER'].':'.$_SERVER['PHP_AUTH_PW'].'@', $base_url );
      $this->base_url = $base_url;
    }
  }
  
  /**
   * Determines if Cenozo is enabled.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @access public
   */
  public function is_enabled()
  {
    return $this->enabled;
  }
  
  /**
   * Adds the current site and role to the arguments
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array& $arguments
   * @access protected
   */
  protected function set_site_and_role( &$arguments )
  {
    $session = lib::create( 'business\session' );
    $arguments['request_site_name'] = $session->get_site()->name;
    $arguments['request_role_name'] = $session->get_role()->name;
  }

  /**
   * Pulls information from Cenozo via HTTP GET
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $subject The pull's subject
   * @param string $name The pull's name
   * @param array $arguments The query data
   * @throws exception\argument
   * @return \StdObject
   * @access public
   */
  public function pull( $subject, $name, $arguments = NULL )
  {
    if( !$this->enabled ) return NULL;
    
    $request = new \HttpRequest();
    $request->enableCookies();
    $request->setUrl( $this->base_url.$subject.'/'.$name );
    $request->setMethod( \HttpRequest::METH_GET );
    
    if( is_null( $arguments ) ) $arguments = array();
    if( !is_array( $arguments ) )
      throw lib::create( 'exception\arguments', $arguments, __METHOD__ );

    // request the current site and role
    $this->set_site_and_role( $arguments );
    $request->setQueryData( $arguments );
    
    $message = static::send( $request );
    return json_decode( $message->body );
  }

  /**
   * Pushes information to Cenozo via HTTP POST
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $subject The push's subject
   * @param string $name The push's name
   * @param array $arguments The post fields
   * @throws exception\argument
   * @access public
   */
  public function push( $subject, $name, $arguments = NULL )
  {
    if( !$this->enabled ) return;

    $request = new \HttpRequest();
    $request->enableCookies();
    $request->setUrl( $this->base_url.$subject.'/'.$name );
    $request->setMethod( \HttpRequest::METH_POST );

    if( is_null( $arguments ) ) $arguments = array();
    if( !is_array( $arguments ) )
      throw lib::create( 'exception\arguments', $arguments, __METHOD__ );

    // request the current site and role
    $this->set_site_and_role( $arguments );
    $request->setPostFields( $arguments );
    
    static::send( $request );
  }

  /**
   * Sends an HTTP request to Cenozo.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param \HttpRequest $request The request to send
   * @throws exception\cenozo, exception\runtime
   * @return \HttpMessage
   * @access protected
   */
  protected static function send( $request )
  {
    $message = $request->send();
    $code = $message->getResponseCode();

    if( 400 == $code )
    { // duplicate cenozo exception
      $body = json_decode( $message->body );
      throw lib::create( 'exception\cenozo_service',
        $body->error_type, $body->error_code, $body->error_message );
    }
    else if( 200 != $code )
    { // A non-cenozo error has happened
      throw lib::create( 'exception\runtime', sprintf(
        'Unable to connect to Cenozo service at %s (code: %s)',
        '',
        $code ), __METHOD__ );
    }

    return $message;
  }

  /**
   * Whether or not Cenozo is enabled
   * @var boolean
   * @access protected
   */
  protected $enbled = false;

  /**
   * The base URL to Cenozo
   * @var string
   * @access protected
   */
  protected $base_url = NULL;

  /**
   * Whether Cenozo has been logged into or not
   * @var boolean
   * @access protected
   */
  protected $logged_in = false;
}
