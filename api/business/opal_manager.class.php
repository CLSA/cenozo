<?php
/**
 * opal_manager.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\business;
use cenozo\lib, cenozo\log;

/**
 * Manages communication with Opal servers
 */
class opal_manager extends \cenozo\factory
{
  /**
   * Constructor.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function __construct()
  {
    $setting_manager = lib::create( 'business\setting_manager' );
    $this->enabled = true === $setting_manager->get_setting( 'opal', 'enabled' );
    $this->server = $setting_manager->get_setting( 'opal', 'server' );
    $this->port = $setting_manager->get_setting( 'opal', 'port' );
    $this->username = $setting_manager->get_setting( 'opal', 'username' );
    $this->password = $setting_manager->get_setting( 'opal', 'password' );
  }

  /**
   * Get a participant's value for a particular variable
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $datasource The datasource to get a value from
   * @param string $table The table to get a value from
   * @param database\participant $db_participant The participant to get a value from
   * @param string $variable The name of the variable to get the value for
   * @return string
   * @throws exception\argument, exception\runtime
   * @access public
   */
  public function get_value( $datasource, $table, $db_participant, $variable )
  {
    if( is_null( $db_participant ) )
      throw lib::create( 'exception\argument', 'db_participant', $db_participant, __METHOD__ );
    else if( 0 == strlen( $variable ) )
      throw lib::create( 'exception\argument', 'variable', $variable, __METHOD__ );

    // prepare the http request
    $authorization = sprintf( '%s:%s', $this->username, $this->password );
    $request = new \HttpRequest();
    $request->setMethod( \HttpRequest::METH_GET );
    $request->addHeaders( array(
      'Authorization' => 'X-Opal-Auth '.base64_encode( $authorization ) ) );

    // send the http request
    $url = sprintf(
      '%s:%d/ws/datasource/%s/table/%s/valueSet/%s/variable/%s/value',
      $this->server,
      $this->port,
      rawurlencode( $datasource ),
      rawurlencode( $table ),
      $db_participant->uid,
      rawurlencode( $variable ) );
    $request->setUrl( $url );
    $message = $request->send();

    $code = $message->getResponseCode();
    if( 200 != $code )
    {
      throw lib::create( 'exception\runtime', sprintf(
        'Unable to connect to Opal service for url "%s" (code: %s)',
        $url,
        $code ) );
    }

    return $util_class_name::json_decode( $message->body );
  }

  /**
   * Whether Opal is enabled.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @access public
   */
  public function get_enabled() { return $this->enabled; }

  /**
   * Whether Opal is enabled.
   * @var boolean
   * @access private
   */
  private $enabled = false;

  /**
   * The Opal server to connect to.
   * @var string
   * @access protected
   */
  protected $server = 'localhost';
  
  /**
   * The Opal port to connect to.
   * @var integer
   * @access protected
   */
  protected $port = 8843;
  
  /**
   * Which username to use when connecting to the server
   * @var string
   * @access protected
   */
  protected $username = '';
  
  /**
   * Which password to use when connecting to the server
   * @var string
   * @access protected
   */
  protected $password = '';
}
