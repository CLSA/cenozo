<?php
/**
 * opal_manager.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\business;
use cenozo\lib, cenozo\log;

/**
 * Manages communication with Opal servers
 */
class opal_manager extends \cenozo\singleton
{
  /**
   * Constructor.
   * 
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
    $this->timeout = $setting_manager->get_setting( 'opal', 'timeout' );
    $this->limit = $setting_manager->get_setting( 'opal', 'limit' );
    $this->failover_enabled = true === $setting_manager->get_setting( 'failover_opal', 'enabled' );
    $this->failover_server = $setting_manager->get_setting( 'failover_opal', 'server' );
    $this->failover_port = $setting_manager->get_setting( 'failover_opal', 'port' );
    $this->failover_username = $setting_manager->get_setting( 'failover_opal', 'username' );
    $this->failover_password = $setting_manager->get_setting( 'failover_opal', 'password' );
    $this->failover_timeout = $setting_manager->get_setting( 'failover_opal', 'timeout' );
  }

  /**
   * Get a participant's value for a particular variable
   * 
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

    $response = $this->send( array(
      'datasource' => $datasource,
      'table' => $table,
      'valueSet' => $db_participant->uid,
      'variable' => $variable,
      'value' => NULL
    ) );

    if( is_null( $response ) )
      log::warning( sprintf( 'Value of Opal variable "%s" was not found.', $variable ) );

    return $response;
  }

  /**
   * Get a participant's set of values for a particular table
   * 
   * @param string $datasource The datasource to get a value from
   * @param string $table The table to get the values from
   * @param database\participant $db_participant The participant to get a value from
   * @return string
   * @throws exception\argument, exception\runtime
   * @access public
   */
  public function get_values( $datasource, $table, $db_participant )
  {
    $util_class_name = lib::get_class_name( 'util' );

    if( is_null( $db_participant ) )
      throw lib::create( 'exception\argument', 'db_participant', $db_participant, __METHOD__ );

    $response = $this->send( array(
      'datasource' => $datasource,
      'table' => $table,
      'valueSet' => $db_participant->uid
    ) );

    $object = $util_class_name::json_decode( $response );
    if( !is_object( $object ) ||
        !property_exists( $object, 'variables' ) ||
        !is_array( $object->variables ) ||
        !property_exists( $object, 'valueSets' ) ||
        !is_array( $object->valueSets ) ||
        1 != count( $object->valueSets ) )
    {
      throw lib::create( 'exception\runtime',
        sprintf( 'Unrecognized response from Opal service for datasource "%s" and table "%s"', $datasource, $table ),
        __METHOD__ );
    }

    return self::get_data( $object->variables, $valueSet->values );
  }

  /**
   * Returns all values in a table or view
   * 
   * @param string $datasource The datasource to get a value from
   * @param string $table The table or view to get the values from
   * @return string
   * @throws exception\argument, exception\runtime
   * @access public
   */
  public function get_all_values( $datasource, $table )
  {
    $util_class_name = lib::get_class_name( 'util' );

    $offset = 0;
    $arguments = array(
      'datasource' => $datasource,
      'table' => $table,
      'limit' => $this->limit,
      'valueSets' => NULL,
      'offset' => 0
    );

    $object = NULL;
    $variables = NULL;
    $valueSets = array();
    do
    {
      $arguments['offset'] = $offset;
      $response = $this->send( $arguments );

      $object = $util_class_name::json_decode( $response );
      if( !is_object( $object ) ||
          !property_exists( $object, 'variables' ) ||
          !is_array( $object->variables ) )
      {
        throw lib::create( 'exception\runtime',
          sprintf( 'Unrecognized response from Opal service for datasource "%s" and table "%s"', $datasource, $table ),
          __METHOD__ );
      }
      
      $variables = $object->variables;
      if( property_exists( $object, 'valueSets' ) ) $valueSets = array_merge( $valueSets, $object->valueSets );

      $offset += $this->limit;
    } while( property_exists( $object, 'valueSets' ) && $this->limit == count( $object->valueSets ) );

    $values = array();
    foreach( $valueSets as $valueSet )
    {
      $identifier = $valueSet->identifier;
      $values[$identifier] = self::get_data( $object->variables, $valueSet->values );
    }

    return $values;
  }

  /**
   * Get a label for a particular variable's value
   * 
   * @param string $datasource The datasource to get a value from
   * @param string $table The table to get a value from
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

    $response = $this->send( array(
      'datasource' => $datasource,
      'table' => $table,
      'variable' => $variable
    ) );

    // find the variable in the response
    $object = $util_class_name::json_decode( $response );
    if( !is_object( $object ) || !property_exists( $object, 'categories' ) )
    {
      $url = sprintf( 'https://%s:%d/ws', $this->server, $this->port );
      throw lib::create( 'exception\runtime',
        sprintf( 'Unrecognized response from Opal service for url "%s"', $url ),
        __METHOD__ );
    }

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
   * Overwrites an existing view
   * 
   * @param string $datasource The datasource to get a value from
   * @param string $view The view to set
   * @param resource $data The data to overwrite the view with
   * @return string
   * @throws exception\argument, exception\runtime
   * @access public
   */
  public function write_view( $datasource, $view, $data )
  {
    if( 0 == strlen( $data ) )
      throw lib::create( 'exception\argument', 'view', $data, __METHOD__ );

    $response = $this->send(
      array(
        'datasource' => $datasource,
        'view' => $view
      ),
      fopen( 'data://text/plain,' . $data, 'r' )
    );

    return $response;
  }

  /**
   * Returns a the data from a returned opal valueSet
   * 
   * @param array $variables The variables property returned by a query to Opal
   * @param array $values The values property in a valueSet return by a query to Opal
   * @return array associated array
   * @access private
   * @static
   */
  private static function get_data( $variables, $values )
  {
    // Opal should have returned the data in the following format:
    // {
    //   "variables": [ "CCT_OAKNEE_TRM", "CCT_OAHAND_TRM", ...  ],
    //   "valueSets": [ {
    //     "identifier": "A003019",
    //     "values": [ {"value": "NO"}, {"value": "NO"}, {"values": [ { "value": "NO" }, { "value": "NO" } ] }...  ],
    //   } ]
    // }
    $row = array();
    foreach( $variables as $index => $variable )
    {
      if( is_object( $values[$index] ) )
      {
        if( property_exists( $values[$index], 'values' ) )
        {
          $row[$variable] = array();
          foreach( $values[$index]->values as $value )
            if( property_exists( $value, 'value' ) )
              $row[$variable][] = $value->value;
        }
        else
        {
          $row[$variable] = property_exists( $values[$index], 'value' )
                          ? $values[$index]->value
                          : NULL;
        }
      }
      else
      {
        $row[$variable] = NULL;
      }
    }

    return $row;
  }

  /**
   * Sends a curl request to the opal server(s)
   * 
   * @param array(key->value) $arguments The url arguments as key->value pairs (value may be null)
   * @param resource $file_handle When not null the contents of the file pointed to by this handle will be sent as a PUT request
   * @return curl resource
   * @access private
   */
  private function send( $arguments, $file_handle = NULL )
  {
    $curl = curl_init();

    $code = 0;

    // if the failover has been activated then skip trying the primary opal server
    if( !$this->failover_activated )
    {
      // prepare cURL request
      $headers = array(
        sprintf( 'Authorization: X-Opal-Auth %s',
                 base64_encode( sprintf( '%s:%s', $this->username, $this->password ) ) ),
        'Accept: application/json' );

      $url = sprintf( 'https://%s:%d/ws', $this->server, $this->port );
      $postfix = array();
      foreach( $arguments as $key => $value )
      {
        if( in_array( $key, array( 'offset', 'limit' ) ) ) $postfix[] = sprintf( '%s=%s', $key, $value );
        else $url .= is_null( $value ) ? sprintf( '/%s', $key ) : sprintf( '/%s/%s', $key, rawurlencode( $value ) );
      }

      if( 0 < count( $postfix ) ) $url .= sprintf( '?%s', implode( '&', $postfix ) );

      // set URL and other appropriate options
      curl_setopt( $curl, CURLOPT_URL, $url );
      curl_setopt( $curl, CURLOPT_SSL_VERIFYPEER, false );
      curl_setopt( $curl, CURLOPT_RETURNTRANSFER, true );
      curl_setopt( $curl, CURLOPT_CONNECTTIMEOUT, $this->timeout );

      if( !is_null( $file_handle ) )
      {
        //curl_setopt( $curl, CURLOPT_CUSTOMREQUEST, 'PUT' );
        curl_setopt( $curl, CURLOPT_PUT, true );
        curl_setopt( $curl, CURLOPT_INFILE, $file_handle );
        curl_setopt( $curl, CURLOPT_INFILESIZE, fstat( $file_handle )['size'] );
        $headers[] = 'Content-Type: application/json';
      }

      curl_setopt( $curl, CURLOPT_HTTPHEADER, $headers );

      $response = curl_exec( $curl );
      $code = curl_getinfo( $curl, CURLINFO_HTTP_CODE );
    }

    // if we time out we'll get a 0 response (timeout)
    if( 0 == $code )
    {
      // try the failover server if it is enabled
      if( $this->failover_enabled )
      {
        if( !$this->failover_activated )
        {
          log::warning( sprintf(
            'Failed to connect to Opal server at "%s", using failover server at "%s" instead.',
            $this->server,
            $this->failover_server
          ) );
          $this->failover_activated = true;
        }

        // prepare cURL request
        $headers = array(
          sprintf( 'Authorization: X-Opal-Auth %s',
                   base64_encode( sprintf( '%s:%s', $this->failover_username, $this->failover_password ) ) ),
          'Accept: application/json' );

        $url = sprintf( 'https://%s:%d/ws', $this->failover_server, $this->failover_port );
        foreach( $arguments as $key => $value )
          $url .= is_null( $value ) ? sprintf( '/%s', $key ) : sprintf( '/%s/%s', $key, rawurlencode( $value ) );

        // set URL and other appropriate options
        curl_setopt( $curl, CURLOPT_URL, $url );
        curl_setopt( $curl, CURLOPT_HTTPHEADER, $headers );
        curl_setopt( $curl, CURLOPT_SSL_VERIFYPEER, false );
        curl_setopt( $curl, CURLOPT_RETURNTRANSFER, true );
        curl_setopt( $curl, CURLOPT_CONNECTTIMEOUT, $this->failover_timeout );

        $response = curl_exec( $curl );
        $code = curl_getinfo( $curl, CURLINFO_HTTP_CODE );
      }
    }

    if( array_key_exists( 'valueSet', $arguments ) && 404 == $code )
    { // 404 on missing data
      throw lib::create( 'exception\argument', 'valueSet', $arguments['valueSet'], __METHOD__ );
    }
    else if( 200 != $code )
    {
      throw lib::create( 'exception\runtime',
        sprintf( 'Unable to connect to Opal service for url "%s" (code: %s)', $url, $code ),
        __METHOD__ );
    }

    return $response;
  }

  /**
   * Whether Opal is enabled.
   * 
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
  private $failover_enabled = false;

  /**
   * The Opal server to connect to.
   * @var string
   * @access protected
   */
  protected $server = 'localhost';
  protected $failover_server = 'localhost';

  /**
   * The Opal port to connect to.
   * @var integer
   * @access protected
   */
  protected $port = 8843;
  protected $failover_port = 8843;

  /**
   * Which username to use when connecting to the server
   * @var string
   * @access protected
   */
  protected $username = '';
  protected $failover_username = '';

  /**
   * Which password to use when connecting to the server
   * @var string
   * @access protected
   */
  protected $password = '';
  protected $failover_password = '';

  /**
   * The number of seconds to wait before giving up on connecting to an Opal server
   * @var integer
   * @access protected
   */
  protected $timeout = 10;
  protected $failover_timeout = 10;

  /**
   * Determines whether the failover has been activated
   * @var boolean
   * @access protected
   */
  protected $failover_activated = false;
}
