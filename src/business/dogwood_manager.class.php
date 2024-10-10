<?php
/**
 * account_manager.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\business;
use cenozo\lib, cenozo\log;

/**
 * Manages user accounts
 */
class dogwood_manager extends \cenozo\singleton
{
  /**
   * Constructor.
   * 
   * @access protected
   */
  protected function __construct()
  {
    $setting_manager = lib::create( 'business\setting_manager' );

    $this->enabled = true === $setting_manager->get_setting( 'dogwood', 'enabled' );
    $this->server = $setting_manager->get_setting( 'dogwood', 'server' );
    $this->organization = $setting_manager->get_setting( 'dogwood', 'organization' );
    $this->username = $setting_manager->get_setting( 'dogwood', 'username' );
    $this->password = $setting_manager->get_setting( 'dogwood', 'password' );
    
    if( $this->enabled ) $this->cenozo_manager = lib::create( 'business\cenozo_manager', $this );
  }

  /**
   * Creates a new user account from a new (unsaved) database\user record
   * 
   * @param database\user $db_user
   * @access public
   */
  public function create( $db_user )
  {
    if( !$this->enabled ) return;

    $path = sprintf( 'organization/name=%s/account/username=%s', $this->organization, $db_user->name );
    $data = new \stdClass;
    if( $db_user->password ) $data->password = $db_user->password;
    if( $db_user->password_type ) $data->password_type = $db_user->password_type;
    $data->email = $db_user->email;

    $response = NULL;
    try
    {
      // first see if the account already exists (throwing exception caught below if not)
      $response = $this->cenozo_manager->get( $path );

      // the account already exists, so update the user record with the password details
      $db_user->hashed_password = $response->password;
      $db_user->password_type = $response->password_type;
    }
    catch( \cenozo\exception\runtime $e )
    {
      // if we get a 404 then the account doesn't exist, so try creating it
      if( preg_match( '/Got response code 404/', $e->get_raw_message() ) )
      {
        $data->username = $db_user->name;
        $data->password = 'unknown'; // the password is set by updating an existing record
        $this->cenozo_manager->post( sprintf( 'organization/name=%s/account', $this->organization ), $data );
      }
    }
  }

  /**
   * Updates a user's account details from an existing database\user record
   * 
   * @param database\user $db_user
   * @access public
   */
  public function update( $db_user )
  {
    if( !$this->enabled ) return;

    $path = sprintf( 'organization/name=%s/account/username=%s', $this->organization, $db_user->name );
    $data = new \stdClass;
    if( $db_user->password ) $data->password = $db_user->password;
    if( $db_user->password_type ) $data->password_type = $db_user->password_type;
    $data->email = $db_user->email;
    $this->cenozo_manager->patch( $path, $data );
  }

  /**
   * Determines whether a username/password pair is valid
   * 
   * @param string $username
   * @param string $password
   * @access public
   */
  public function validate( $username, $password )
  {
    if( !$this->enabled ) return false;

    $user_class_name = lib::get_class_name( 'database\user' );
    $path = sprintf( 'organization/name=%s/account/username=%s', $this->organization, $username );

    // get the account details
    $response = $this->cenozo_manager->get( $path );

    // test the password
    $valid = 'whirlpool' == $response->password_type ?
      hash( 'whirlpool', $password ) === $response->password :
      password_verify( $password, $response->password );

    if( $valid )
    {
      // convert old whirlpool hashes to bcrypt
      $db_user = $user_class_name::get_unique_record( 'name', $username );
      if( !is_null( $db_user ) )
      {
        if( 'whirlpool' == $db_user->password_type )
        {
          $db_user->password = $password;
          $db_user->save();
        }

        if( 'whirlpool' == $response->password_type )
        {
          $this->update( $db_user );
        }
      }
    }

    return $valid;
  }

  /** 
   * Returns whether or not a dogwood service is in use and enabled
   * 
   * @return boolean
   */
  public function get_enabled()
  {
    return $this->enabled;
  }

  /** 
   * Returns the dogwood service's server
   * 
   * @return string
   */
  public function get_server()
  {
    return $this->server;
  }

  /** 
   * Returns the dogwood service's organization
   * 
   * @return string
   */
  public function get_organization()
  {
    return $this->organization;
  }

  /** 
   * Returns the dogwood service's username
   * 
   * @return string
   */
  public function get_username()
  {
    return $this->username;
  }

  /** 
   * Returns the dogwood service's password
   * 
   * @return string
   */
  public function get_password()
  {
    return $this->password;
  }

  /**
   * The cenozo_manager used to communicate with the dogwood service
   * @var business\cenozo_manager
   * @access private
   */
  private $cenozo_manager = NULL;

  /**
   * Whether the dogwood service is enabled
   * @var boolean
   * @access private
   */
  private $enabled = false;

  /**
   * The dogwood service's address
   * @var string
   * @access private
   */
  private $server = NULL;

  /**
   * The dogwood service's organization that contains this application's accounts
   * @var string
   * @access private
   */
  private $organization = NULL;

  /**
   * The username used to connect to the dogwood service.
   * @var string
   * @access private
   */
  private $username = NULL;

  /**
   * The password used to connect to the dogwood service.
   * @var string
   * @access private
   */
  private $password = NULL;
}
