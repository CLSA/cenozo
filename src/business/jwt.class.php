<?php
/**
 * jwt.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\business;
use cenozo\lib, cenozo\log;

require_once '/usr/local/lib/php-jwt/src/BeforeValidException.php';
require_once '/usr/local/lib/php-jwt/src/ExpiredException.php';
require_once '/usr/local/lib/php-jwt/src/JWT.php';
require_once '/usr/local/lib/php-jwt/src/SignatureInvalidException.php';
require_once '/usr/local/lib/php-jwt/src/CachedKeySet.php';
require_once '/usr/local/lib/php-jwt/src/JWK.php';
require_once '/usr/local/lib/php-jwt/src/Key.php';

/**
 * A class to encode and decode Javascript Web Tokens (JWTs)
 */
class jwt extends \cenozo\base_object
{
  /**
   * Constructor.
   */
  public function __construct()
  {
    $util_class_name = lib::get_class_name( 'util' );
    $setting_manager = lib::create( 'business\setting_manager' );
    $session = lib::create( 'business\session' );
    $now = $util_class_name::get_datetime_object();
    $expiry = clone $now;
    $timeout = $setting_manager->get_setting( 'general', 'activity_timeout' );
    $expiry->add( new \DateInterval( sprintf( 'PT%dM', $timeout ) ) );
    \Firebase\JWT\JWT::$leeway = 60;

    $this->iss = $session->get_application()->url;
    $this->iat = $now->getTimestamp();
    $this->nbf = $now->getTimestamp();
    $this->exp = $expiry->getTimestamp();
  }

  /**
   * Decodes and loads an encoded JWT token
   * @param string $encoded_jst
   */
  public function decode( $encoded_jwt )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $setting_manager = lib::create( 'business\setting_manager' );

    $success = true;
    try
    {
      // If an encoded value was provided then decode it
      $decoded_jwt = \Firebase\JWT\JWT::decode(
        $encoded_jwt,
        new \Firebase\JWT\Key( $setting_manager->get_setting( 'general', 'jwt_key' ), 'HS256' )
      );

      // read the details into the object properties
      $this->iss = $decoded_jwt->iss;
      $this->iat = $decoded_jwt->iat;
      $this->nbf = $decoded_jwt->nbf;
      $this->exp = $decoded_jwt->exp;

      // data has to be converted from an object to an array
      $this->data = $util_class_name::json_decode(
        $util_class_name::json_encode( $decoded_jwt->data ),
        true
      );
    }
    catch( \UnexpectedValueException $e )
    {
      $this->iss = NULL;
      $this->iat = NULL;
      $this->nbf = NULL;
      $this->exp = NULL;
      $this->data = array();
      $success = false;
    }

    return $success;
  }

  /**
   * Determines whether this JWT is valid.
   * 
   * This is done by testing the token's URL, not-before and expiry timestamps
   * @return boolean
   */
  public function is_valid()
  {
    $util_class_name = lib::get_class_name( 'util' );
    $session = lib::create( 'business\session' );
    $now = $util_class_name::get_datetime_object();

    // make sure the URL matches, and the token is not outside the valid timestamps
    return $this->iss == $session->get_application()->url &&
           $this->nbf <= $now->getTimestamp() &&
           $this->exp > $now->getTimestamp();
  }

  /**
   * Returns the JWT as an encoded string
   * @return string
   */
  public function get_encoded_value()
  {
    // make sure the JWT has been encoded before returning it
    if( is_null( $this->encoded_value ) ) $this->reencode();
    return $this->encoded_value;
  }

  /**
   * Gets data stored in to the JWT
   * @param string $name
   * @return string
   */
  public function get_data( $name )
  {
    return $this->data[$name];
  }

  /**
   * Sets data into the JWT
   * @param string $name
   * @param string $value
   */
  public function set_data( $name, $value )
  {
    $this->data[$name] = $value;

    // if the JWT is already encoded then re-encode it to make sure the change is included
    if( !is_null( $this->encoded_value ) ) $this->reencode();
  }

  /**
   * Removes data from the JWT
   * @param string $name
   */
  public function remove_data( $name )
  {
    unset( $this->data[$name] );

    // if the JWT is already encoded then re-encode it to make sure the change is included
    if( !is_null( $this->encoded_value ) ) $this->reencode();
  }

  /**
   * Used internally to reencode the JWT into an encrypted string
   */
  private function reencode()
  {
    $setting_manager = lib::create( 'business\setting_manager' );

    $this->encoded_value = \Firebase\JWT\JWT::encode(
      array(
        'iss' => $this->iss,
        'iat' => $this->iat,
        'nbf' => $this->nbf,
        'exp' => $this->exp,
        'data' => $this->data
      ),
      $setting_manager->get_setting( 'general', 'jwt_key' ),
      'HS256'
    );
  }

  /**
   * The issuer of the JWT (represented by the application URL)
   * @var string
   */
  private $iss = NULL;

  /**
   * The UNIX timestamp of when the JWT was issued
   * @var integer
   */
  private $iat = NULL;

  /**
   * The UNIX timestamp of the earliest time the JWT is valid
   * @var integer
   */
  private $nbf = NULL;

  /**
   * The UNIX timestamp of when the JWT expires
   * @var integer
   */
  private $exp = NULL;

  /**
   * An array of all data belonging to the JWT
   * @var array
   */
  private $data = array();

  /**
   * The encoded string representation of the JWT
   * @var string
   */
  private $encoded_value = NULL;
}
