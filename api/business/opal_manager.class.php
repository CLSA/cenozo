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

    // prepare cURL request
    $headers = array(
      sprintf( 'Authorization: X-Opal-Auth %s',
               base64_encode( sprintf( '%s:%s', $this->username, $this->password ) ) ) );

    $url = sprintf(
      'https://%s:%d/ws/datasource/%s/table/%s/valueSet/%s/variable/%s/value',
      $this->server,
      $this->port,
      rawurlencode( $datasource ),
      rawurlencode( $table ),
      $db_participant->uid,
      rawurlencode( $variable ) );

    $curl = curl_init();

    // set URL and other appropriate options
    curl_setopt( $curl, CURLOPT_URL, $url );
    curl_setopt( $curl, CURLOPT_HTTPHEADER, $headers );
    curl_setopt( $curl, CURLOPT_SSL_VERIFYPEER, false );
    curl_setopt( $curl, CURLOPT_RETURNTRANSFER, true );

    $value = curl_exec( $curl );
    $code = curl_getinfo( $curl, CURLINFO_HTTP_CODE );

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

    if( is_null( $value ) )
      log::warning( sprintf( 'Value of Opal variable "%s" was not found.', $variable ) );

    return $value;
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
   * @param database\language $db_language Which language to return the label in
   * @return string
   * @throws exception\argument, exception\runtime
   * @access public
   */
  public function get_label( $datasource, $table, $variable, $value, $db_language = NULL )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $language_class_name = lib::get_class_name( 'database\language' );

    if( 0 == strlen( $variable ) )
      throw lib::create( 'exception\argument', 'variable', $variable, __METHOD__ );
    else if( 0 == strlen( $value ) )
      throw lib::create( 'exception\argument', 'value', $value, __METHOD__ );

    // if no language is specified then use english
    if( is_null( $db_language ) ) $db_language = $language_class_name::get_unique_record( 'code', 'en' );

    // prepare cURL request
    $headers = array(
      sprintf( 'Authorization: X-Opal-Auth %s',
               base64_encode( sprintf( '%s:%s', $this->username, $this->password ) ) ),
      'Accept: application/json' );

    $url = sprintf(
      'https://%s:%d/ws/datasource/%s/table/%s/variable/%s',
      $this->server,
      $this->port,
      rawurlencode( $datasource ),
      rawurlencode( $table ),
      rawurlencode( $variable ) );

    $curl = curl_init();

    // set URL and other appropriate options
    curl_setopt( $curl, CURLOPT_URL, $url );
    curl_setopt( $curl, CURLOPT_HTTPHEADER, $headers );
    curl_setopt( $curl, CURLOPT_SSL_VERIFYPEER, false );
    curl_setopt( $curl, CURLOPT_RETURNTRANSFER, true );

    $result = curl_exec( $curl );
    $code = curl_getinfo( $curl, CURLINFO_HTTP_CODE );

    if( 200 != $code )
    {
      throw lib::create( 'exception\runtime',
        sprintf( 'Unable to connect to Opal service for url "%s" (code: %s)', $url, $code ),
        __METHOD__ );
    }
    
    // find the variable in the response
    $object = $util_class_name::json_decode( $result );
    if( !is_object( $object ) || !property_exists( $object, 'categories' ) )
      throw lib::create( 'exception\runtime',
        sprintf( 'Unrecognized response from Opal service for url "%s"', $url ),
        __METHOD__ );

    $label = NULL;
    foreach( $object->categories as $category )
    {
      if( $value == $category->name )
      {
        foreach( $category->attributes as $attribute )
        {
          if( 'label' == $attribute->name && $db_language->code == $attribute->locale )
            $label = utf8_decode( $attribute->value );

          if( !is_null( $label ) ) break;
        }
      }
      if( !is_null( $label ) ) break;
    }

    if( is_null( $label ) )
      log::warning( sprintf( 'Label of Opal variable "%s" was not found.', $variable ) );

    return $label;
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
