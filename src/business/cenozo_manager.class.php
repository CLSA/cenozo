<?php
/**
 * cenozo_manager.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\business;
use cenozo\lib, cenozo\log;

/**
 * Manages communication with Cenozo applications
 */
class cenozo_manager extends \cenozo\base_object
{
  /**
   * Constructor.
   * 
   * @param database\application|string $application
   * @access protected
   */
  public function __construct( $application )
  {
    if( is_string( $application ) )
    {
      $application_class_name = lib::get_class_name( 'database\application' );
      $application = $application_class_name::get_unique_record( 'name', $application );
    }

    if( !is_null( $application ) )
    {
      if( is_a( $application, lib::get_class_name( 'business\dogwood_manager' ) ) )
      {
        $this->url = $application->get_server();
        $this->title = 'Dogwood';
        $this->username = $application->get_username();
        $this->password = $application->get_password();
      }
      else
      {
        $setting_manager = lib::create( 'business\setting_manager' );
        $this->url = $application->url;
        $this->title = $application->title;
        $this->username = $setting_manager->get_setting( 'utility', 'username' );
        $this->password = $setting_manager->get_setting( 'utility', 'password' );
      }
    }
  }

  /**
   * Determines whether the application exists
   * @return boolean
   * @access public
   */
  public function exists()
  {
    return !is_null( $this->url );
  }

  /**
   * Sends a curl GET request to the cenozo application
   * 
   * @param string $api_path The internal cenozo path (not including base url)
   * @return curl resource
   * @access public
   */
  public function get( $api_path )
  {
    return $this->send( $api_path );
  }

  /**
   * Sends a curl DELETE request to the cenozo application
   * 
   * @param string $api_path The internal cenozo path (not including base url)
   * @return curl resource
   * @access public
   */
  public function delete( $api_path )
  {
    return $this->send( $api_path, 'DELETE' );
  }

  /**
   * Sends a curl POST request to the cenozo application
   * 
   * @param string $api_path The internal cenozo path (not including base url)
   * @param string $data The data to post to the application
   * @return curl resource
   * @access public
   */
  public function post( $api_path, $data = NULL )
  {
    if( is_null( $data ) ) $data = new \stdClass;
    return $this->send( $api_path, 'POST', $data );
  }

  /**
   * Sends a curl PATCH request to the cenozo application
   * 
   * @param string $api_path The internal cenozo path (not including base url)
   * @param string $data The patch data to send to the application
   * @return curl resource
   * @access public
   */
  public function patch( $api_path, $data = NULL )
  {
    if( is_null( $data ) ) $data = new \stdClass;
    return $this->send( $api_path, 'PATCH', $data );
  }

  /**
   * Sends curl requests
   * 
   * @param string $api_path The internal cenozo path (not including base url)
   * @return curl resource
   * @access public
   */
  private function send( $api_path, $method = 'GET', $data = NULL )
  {
    if( !$this->exists() ) return NULL;

    $util_class_name = lib::get_class_name( 'util' );
    $header_list = [
      sprintf(
        'Authorization: Basic %s',
        base64_encode( sprintf( '%s:%s', $this->username, $this->password ) )
      )
    ];

    $code = 0;

    // prepare cURL request
    $url = sprintf( '%s/api/%s', $this->url, $api_path );

    // set URL and other appropriate options
    $curl = curl_init();
    curl_setopt( $curl, CURLOPT_URL, $url );
    curl_setopt( $curl, CURLOPT_SSL_VERIFYPEER, false );
    curl_setopt( $curl, CURLOPT_RETURNTRANSFER, true );
    curl_setopt( $curl, CURLOPT_CONNECTTIMEOUT, $this->timeout );

    if( 'POST' == $method )
    {
      curl_setopt( $curl, CURLOPT_POST, true );
    }
    else if( in_array( $method, [ 'DELETE', 'PATCH' ] ) )
    {
      curl_setopt( $curl, CURLOPT_CUSTOMREQUEST, $method );
    }

    if( !is_null( $data ) )
    {
      $header_list[] = 'Content-Type: application/json';
      curl_setopt( $curl, CURLOPT_POSTFIELDS, $util_class_name::json_encode( $data ) );
    }

    curl_setopt( $curl, CURLOPT_HTTPHEADER, $header_list );

    $response = curl_exec( $curl );
    if( curl_errno( $curl ) )
    {
      throw lib::create( 'exception\runtime',
        sprintf( 'Got error code %s when trying %s request to %s.  Message: %s',
                 curl_errno( $curl ),
                 $method,
                 $this->title,
                 curl_error( $curl ) ),
        __METHOD__ );
    }
    
    $code = curl_getinfo( $curl, CURLINFO_HTTP_CODE );
    if( 306 == $code )
    {
      // pass on notices
      throw lib::create( 'exception\notice', trim( $response, '"' ), __METHOD__ );
    }
    else if( 204 == $code || 300 <= $code )
    {
      throw lib::create( 'exception\runtime',
        sprintf( 'Got response code %s when trying %s request to %s.  Response %s',
                 $code,
                 $method,
                 $this->title,
                 $response ),
        __METHOD__ );
    }

    return json_decode( $response );
  }

  /**
   * The cenozo application's base URL (including https://)
   * @var 
   * @access private
   */
  private $url = NULL;

  /**
   * The cenozo application's title (used for logging)
   * @var 
   * @access private
   */
  private $title = NULL;

  /**
   * What username to use when connecting to the cenozo application
   * @var 
   * @access private
   */
  private $username = NULL;

  /**
   * What password to use when connecting to the cenozo application
   * @var 
   * @access private
   */
  private $password = NULL;

  /**
   * The number of seconds to wait before giving up on connecting to the application
   * @var integer
   * @access private
   */
  private $timeout = 5;
}
