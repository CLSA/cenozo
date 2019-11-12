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
   * @param database\application|string $db_application
   * @access protected
   */
  public function __construct( $db_application )
  {
    if( is_string( $db_application ) )
    {
      $application_class_name = lib::get_class_name( 'database\application' );
      $db_application = $application_class_name::get_unique_record( 'name', $db_application );
    }

    $this->db_application = $db_application;
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
    $setting_manager = lib::create( 'business\setting_manager' );
    $user = $setting_manager->get_setting( 'utility', 'username' );
    $pass = $setting_manager->get_setting( 'utility', 'password' );

    $code = 0;

    // prepare cURL request
    $url = sprintf( '%s/api/%s', $this->db_application->url, $api_path );

    // set URL and other appropriate options
    $curl = curl_init();
    curl_setopt( $curl, CURLOPT_URL, $url );
    curl_setopt( $curl, CURLOPT_SSL_VERIFYPEER, false );
    curl_setopt( $curl, CURLOPT_RETURNTRANSFER, true );
    curl_setopt( $curl, CURLOPT_CONNECTTIMEOUT, $this->timeout );
    curl_setopt( $curl, CURLOPT_HTTPHEADER,
      array( sprintf( 'Authorization: Basic %s', base64_encode( sprintf( '%s:%s', $user, $pass ) ) ) )
    );

    $response = curl_exec( $curl );
    if( curl_errno( $curl ) )
    {
      throw lib::create( 'exception\runtime',
        sprintf( 'Got error code %s when trying to connect to %s.  Message: %s',
                 curl_errno( $curl ),
                 $this->db_application->title,
                 curl_error( $curl ) ),
        __METHOD__ );
    }
    
    $code = curl_getinfo( $curl, CURLINFO_HTTP_CODE );
    if( 300 <= $code )
    {
      throw lib::create( 'exception\runtime',
        sprintf( 'Got response code %s when trying to connect to %s.',
                 $code,
                 $this->db_application->title ),
        __METHOD__ );
    }

    return json_decode( $response );
  }

  /**
   * Sends a curl POST request to the cenozo application
   * 
   * @param string $api_path The internal cenozo path (not including base url)
   * @param string $data The data to post to the application
   * @return curl resource
   * @access public
   */
  public function post( $api_path, $data )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $setting_manager = lib::create( 'business\setting_manager' );
    $user = $setting_manager->get_setting( 'utility', 'username' );
    $pass = $setting_manager->get_setting( 'utility', 'password' );

    $code = 0;

    // prepare cURL request
    $url = sprintf( '%s/api/%s', $this->db_application->url, $api_path );

    // set URL and other appropriate options
    $curl = curl_init();
    curl_setopt( $curl, CURLOPT_URL, $url );
    curl_setopt( $curl, CURLOPT_SSL_VERIFYPEER, false );
    curl_setopt( $curl, CURLOPT_RETURNTRANSFER, true );
    curl_setopt( $curl, CURLOPT_CONNECTTIMEOUT, $this->timeout );
    curl_setopt( $curl, CURLOPT_HTTPHEADER,
      array( sprintf( 'Authorization: Basic %s', base64_encode( sprintf( '%s:%s', $user, $pass ) ) ) )
    );
    curl_setopt( $curl, CURLOPT_POST, true );
    curl_setopt( $curl, CURLOPT_POSTFIELDS, $util_class_name::json_encode( $data ) );

    $response = curl_exec( $curl );
    if( curl_errno( $curl ) )
    {
      throw lib::create( 'exception\runtime',
        sprintf( 'Got error code %s when trying to connect to %s.  Message: %s',
                 curl_errno( $curl ),
                 $this->db_application->title,
                 curl_error( $curl ) ),
        __METHOD__ );
    }
    
    $code = curl_getinfo( $curl, CURLINFO_HTTP_CODE );
    if( 300 <= $code )
    {
      throw lib::create( 'exception\runtime',
        sprintf( 'Got response code %s when trying to connect to %s.',
                 $code,
                 $this->db_application->title ),
        __METHOD__ );
    }

    return json_decode( $response );
  }

  /**
   * The application to connect to
   * @var database\application
   * @access protected
   */
  protected $db_application = NULL;

  /**
   * The number of seconds to wait before giving up on connecting to the application
   * @var integer
   * @access protected
   */
  protected $timeout = 5;
}
