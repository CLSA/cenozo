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
  protected function __construct( $arguments )
  {
    $setting_manager = lib::create( 'business\setting_manager' );
    $this->enabled = true === $setting_manager->get_setting( 'opal', 'enabled' );
    $this->server = $arguments[0];
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
      'https://%s:%d/ws/datasource/%s/table/%s/valueSet/%s/variable/%s/value',
      $this->server,
      $this->port,
      rawurlencode( $datasource ),
      rawurlencode( $table ),
      $db_participant->uid,
      rawurlencode( $variable ) );
    $request->setUrl( $url );
    
    try
    {
      $message = $request->send();
    }
    catch( \Exception $e )
    {
      // We've caught one of HttpRuntime, HttpRequest, HttpMalformedHeader or HttpEncoding Exceptions
      // These errors may be transient, so instruct the user to reload the page
      throw lib::create( 'exception\notice',
        'The server appears to be busy, please try reloading the page. '.
        'If this still does not fix the problem please report the issue to a superior.',
        __METHOD__ );
    }

    $code = $message->getResponseCode();
    if( 404 == $code )
    { // 404 on missing data
      throw lib::create( 'exception\argument', 'participant', $db_participant->uid, __METHOD__ );
    }
    else if( 200 != $code )
    {
      throw lib::create( 'exception\runtime',
        sprintf( 'Unable to connect to Opal service for url "%s" (code: %s)', $url, $code ),
        __METHOD__ );
    }

    return $message->body;
  }

  /**
   * Get a label for a particular variable's value
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $datasource The datasource to get a value from
   * @param string $table The table to get a value from
   * @param database\participant $db_participant The participant to get a value from
   * @param string $variable The name of the variable to get the label for
   * @param string $value The value of the variable to get the label for
   * @param string $locale Which locale (language) to return the label in
   * @return string
   * @throws exception\argument, exception\runtime
   * @access public
   */
  public function get_label( $datasource, $table, $variable, $value, $locale )
  {
    $util_class_name = lib::get_class_name( 'util' );

    if( 0 == strlen( $variable ) )
      throw lib::create( 'exception\argument', 'variable', $variable, __METHOD__ );
    else if( 0 == strlen( $value ) )
      throw lib::create( 'exception\argument', 'value', $value, __METHOD__ );
    else if( 0 == strlen( $locale ) )
      throw lib::create( 'exception\argument', 'locale', $locale, __METHOD__ );

    // prepare the http request
    $authorization = sprintf( '%s:%s', $this->username, $this->password );
    $request = new \HttpRequest();
    $request->setMethod( \HttpRequest::METH_GET );
    $request->addHeaders( array(
      'Authorization' => 'X-Opal-Auth '.base64_encode( $authorization ),
      'Accept' => 'application/json' ) );

    // send the http request
    $url = sprintf(
      'https://%s:%d/ws/datasource/%s/table/%s/variable/%s',
      $this->server,
      $this->port,
      rawurlencode( $datasource ),
      rawurlencode( $table ),
      rawurlencode( $variable ) );
    $request->setUrl( $url );
    
    try
    {
      $message = $request->send();
    }
    catch( \Exception $e )
    {
      // We've caught one of HttpRuntime, HttpRequest, HttpMalformedHeader or HttpEncoding Exceptions
      // These errors may be transient, so instruct the user to reload the page
      throw lib::create( 'exception\notice',
        'The server appears to be busy, please try reloading the page. '.
        'If this still does not fix the problem please report the issue to a superior.',
        __METHOD__ );
    }

    $code = $message->getResponseCode();
    if( 200 != $code )
    {
      throw lib::create( 'exception\runtime',
        sprintf( 'Unable to connect to Opal service for url "%s" (code: %s)', $url, $code ),
        __METHOD__ );
    }

    // find the variable in the response
    $object = $util_class_name::json_decode( $message->body );
    if( !is_object( $object ) || !property_exists( $object, 'categories' ) )
      throw lib::create( 'exception\runtime',
        sprintf( 'Unrecognized response from Opal service for url "%s"', $url ),
        __METHOD__ );

    $label = NULL;
    foreach( $object->categories as $category )
      if( $value == $category->name )
        foreach( $category->attributes as $attribute )
          if( 'label' == $attribute->name && $locale == $attribute->locale )
            return utf8_decode( $attribute->value );

    log::warning( sprintf( 'Label of Opal variable "%s" was not found.', $variable ) );
    return NULL;
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
