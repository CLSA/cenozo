<?php
/**
 * cenozo_manager.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\business;
use cenozo\lib, cenozo\log;

/**
 * Manages communication with other cenozo services.
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
    if( $this->enabled ) $this->base_url = $url.'/';
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

    $util_class_name = lib::get_class_name( 'util' );
    
    $auth = array( 'httpauth' => $_SERVER['PHP_AUTH_USER'].':'.$_SERVER['PHP_AUTH_PW'] );
    
    if( $this->machine_credentials )
    { // replace credentials if needed
      $setting_manager = lib::create( 'business\setting_manager' );
      $user = $setting_manager->get_setting( 'general', 'machine_user' );
      $pass = $setting_manager->get_setting( 'general', 'machine_password' );
      $auth['httpauth'] = $user.':'.$pass;
    }

    $request = new \HttpRequest();
    $request->enableCookies();
    $request->setUrl( $this->base_url.$subject.'/'.$name );
    $request->setMethod( \HttpRequest::METH_GET );
    $request->addHeaders( array( 'application_name' => APPNAME ) );
    $request->setOptions( $auth );
    
    if( is_null( $arguments ) ) $arguments = array();
    if( !is_array( $arguments ) )
      throw lib::create( 'exception\arguments', $arguments, __METHOD__ );

    // request the current site and role
    $this->set_site_and_role( $arguments );
    $request->setQueryData( static::prepare_arguments( $arguments ) );
    
    try
    {
      $message = static::send( $request );
    }
    catch( \Exception $e )
    {
      throw lib::create( 'exception\runtime',
        sprintf( 'Unable to send request to pull/%s/%s', $subject, $name ), __METHOD__, $e );
    }

    return $util_class_name::json_decode( $message->body );
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

    $auth = array( 'httpauth' => $_SERVER['PHP_AUTH_USER'].':'.$_SERVER['PHP_AUTH_PW'] );
    
    if( $this->machine_credentials )
    { // replace credentials if needed
      $setting_manager = lib::create( 'business\setting_manager' );
      $user = $setting_manager->get_setting( 'general', 'machine_user' );
      $pass = $setting_manager->get_setting( 'general', 'machine_password' );
      $auth['httpauth'] = $user.':'.$pass;
    }

    $request = new \HttpRequest();
    $request->enableCookies();
    $request->setUrl( $this->base_url.$subject.'/'.$name );
    $request->setMethod( \HttpRequest::METH_POST );
    $request->addHeaders( array( 'application_name' => APPNAME ) );
    $request->setOptions( $auth );

    if( is_null( $arguments ) ) $arguments = array();
    if( !is_array( $arguments ) )
      throw lib::create( 'exception\arguments', $arguments, __METHOD__ );

    // request the current site and role
    $this->set_site_and_role( $arguments );
    $request->setPostFields( static::prepare_arguments( $arguments ) );

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

    $util_class_name = lib::get_class_name( 'util' );
    
    if( 400 == $code )
    { // pass on the exception which was thrown by the service
      $body = $util_class_name::json_decode( $message->body );
      
      $number = preg_replace( '/[^0-9]/', '', $body->error_code );

      throw 'Notice' == $body->error_type
         ? lib::create( 'exception\notice', $body->error_message, $number - 400000 )
         : lib::create( 'exception\cenozo_service',
             $body->error_type, $body->error_code, $body->error_message );
    }
    else if( 200 != $code )
    { // A non-cenozo error has happened
      throw lib::create( 'exception\runtime', sprintf(
        'Unable to connect to Cenozo service at %s (code: %s)',
        $base_url,
        $code ), __METHOD__ );
    }

    return $message;
  }

  /**
   * Prepares arguments by converting all objects into serialized strings.
   * Note that just because an object gets serialized before being sent doesn't mean it will
   * automatically be unseralized by the receiving application.  For security reasons it is up
   * to the receiving to pre-define objects that it expects and explicitely unserialized them
   * itself.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param mixed $args
   * @return mixed
   * @static
   * @access protected
   */
  protected static function prepare_arguments( $args )
  {
    // serialize the argument if it is an object
    $prepared_args = is_object( $args ) ? serialize( $args ) : $args;

    // if the argument is an array make sure to prepare each element
    if( is_array( $args ) )
      foreach( $args as $key => $value )
        $prepared_args[$key] = static::prepare_arguments( $value );

    return $prepared_args;
  }

  /**
   * Whether to replace the user with machine credentials when sending requests.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param boolean $use
   * @access public
   */
  public function use_machine_credentials( $use )
  {
    $this->machine_credentials = (bool) $use;
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

  /**
   * Whether to use the machine's credentials when sending a request
   * @var boolean
   * @access private
   */
  private $machine_credentials = false;
}
