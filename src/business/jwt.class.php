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

  public function get_encoded_value()
  {
    // make sure the JWT has been encoded before returning it
    if( is_null( $this->encoded_value ) ) $this->reencode();
    return $this->encoded_value;
  }

  public function get_data( $name )
  {
    return $this->data[$name];
  }

  public function set_data( $name, $value )
  {
    $this->data[$name] = $value;

    // if the JWT is already encoded then re-encode it to make sure the change is included
    if( !is_null( $this->encoded_value ) ) $this->reencode();
  }

  public function remove_data( $name )
  {
    unset( $this->data[$name] );

    // if the JWT is already encoded then re-encode it to make sure the change is included
    if( !is_null( $this->encoded_value ) ) $this->reencode();
  }
  
  public function validate()
  {
    $util_class_name = lib::get_class_name( 'util' );
    $setting_manager = lib::create( 'business\setting_manager' );

    $valid = false;
    
    try
    {
    }
    catch( \UnexpectedValueException $e )
    {
      // the jwt couldn't be decoded, so it is considered invalid but no other error handling is necessary
    }

    return $valid;
  }

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

  private $iss = NULL;
  private $iat = NULL;
  private $nbf = NULL;
  private $exp = NULL;
  private $data = array();
  private $encoded_value = NULL;
}
