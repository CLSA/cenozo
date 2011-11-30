<?php
/**
 * ldap_manager.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\business
 * @filesource
 */

namespace cenozo\business;
use cenozo\log, cenozo\util;
use cenozo\database as db;
use cenozo\exception as exc;

/**
 * Manages LDAP entries
 * 
 * @package cenozo\business
 */
class ldap_manager extends \cenozo\singleton
{
  /**
   * Constructor.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function __construct()
  {
    $setting_manager = setting_manager::self();
    $this->server = $setting_manager->get_setting( 'ldap', 'server' );
    $this->port = $setting_manager->get_setting( 'ldap', 'port' );
    $this->base = $setting_manager->get_setting( 'ldap', 'base' );
    $this->username = $setting_manager->get_setting( 'ldap', 'username' );
    $this->password = $setting_manager->get_setting( 'ldap', 'password' );
    $this->active_directory = $setting_manager->get_setting( 'ldap', 'active_directory' );
  }

  /**
   * Destructor which unbinds the LDAP connection, if one exists
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function __destruct()
  {
    if( is_resource( $this->resource ) ) @ldap_unbind( $this->resource );
    $this->resource = NULL;
  }
    
  /**
   * Initializes the ldap manager.
   * This method is called internally by the class whenever necessary.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\ldap
   * @access public
   */
  private function connect()
  {
    if( is_resource( $this->resource ) ) return;

    $this->resource = ldap_connect( $this->server, $this->port );
    if( $this->active_directory )
    {
      if( false == @ldap_set_option( $this->resource, LDAP_OPT_PROTOCOL_VERSION, 3 ) )
        throw util::create( 'exception\ldap', ldap_error( $this->resource ), ldap_errno( $this->resource ) );
    }

    if( !( @ldap_bind( $this->resource, $this->username, $this->password ) ) )
      throw util::create( 'exception\ldap', ldap_error( $this->resource ), ldap_errno( $this->resource ) );
  }
  
  /**
   * Creates a new user.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $username The new username to create
   * @param string $first_name The user's first name
   * @param string $last_name The user's last name
   * @param string $password The initial password for the account
   * @throws exception\ldap
   * @access public
   */
  public function new_user( $username, $first_name, $last_name, $password )
  {
    $this->connect();

    $data = array (
      'cn' => $first_name.' '.$last_name,
      'sn' => $last_name,
      'givenname' => $first_name,
      'uid' => $username,
      'objectClass' => array (
        'inetOrgPerson',
        'passwordHolder' ),
      'description' => 'clsa',
      'userpassword' => util::sha1_hash( $password ) );
    
    $dn = sprintf( 'uid=%s,ou=Users,%s', $username, $this->base );
    if( !( @ldap_add( $this->resource, $dn, $data ) ) )
      throw util::create( 'exception\ldap', ldap_error( $this->resource ), ldap_errno( $this->resource ) );
  }

  /**
   * Deletes a user.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $username The username to delete
   * @throws exception\ldap
   * @access public
   */
  public function delete_user( $username )
  {
    $this->connect();
    
    $dn = sprintf( 'uid=%s,ou=Users,%s', $username, $this->base );
    if( !( @ldap_delete( $this->resource, $dn ) ) )
      throw util::create( 'exception\ldap', ldap_error( $this->resource ), ldap_errno( $this->resource ) );
  }

  /**
   * Validate's a user/password pair, returning true if the password is a match and false if not
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $username
   * @param string $password
   * @throws exception\ldap, exception\runtime
   * @return boolean
   * @access public
   */
  public function validate_user( $username, $password )
  {
    $this->connect();

    $search = @ldap_search( $this->resource, $this->base, sprintf( '(&(uid=%s))', $username ) );
    if( !$search )
      throw util::create( 'exception\ldap', ldap_error( $this->resource ), ldap_errno( $this->resource ) );
  
    $entries = @ldap_get_entries( $this->resource, $search );
    ldap_free_result( $search );
    if( !$entries )
      throw util::create( 'exception\ldap', ldap_error( $this->resource ), ldap_errno( $this->resource ) );
  
    if( 0 == $entries['count'] )
      throw util::create( 'exception\runtime', sprintf( 'User %s not found.', $username ), __METHOD__ );
  
    $dn = $entries[0]['dn'];
    $test = @ldap_bind( $this->resource, $dn, $password );

    if( !$test && 49 != ldap_errno( $this->resource ) )
      throw util::create( 'exception\ldap', ldap_error( $this->resource ), ldap_errno( $this->resource ) );
    
    return $test;
  }

  /**
   * Sets a user's password
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $username Which user to affect
   * @param string $password The new password for the account
   * @throws exception\ldap, exception\runtime
   * @access public
   */
  public function set_user_password( $username, $password )
  {
    $this->connect();

    $search = @ldap_search( $this->resource, $this->base, sprintf( '(&(uid=%s))', $username ) );
    if( !$search )
      throw util::create( 'exception\ldap', ldap_error( $this->resource ), ldap_errno( $this->resource ) );
    
    $entries = @ldap_get_entries( $this->resource, $search );
    ldap_free_result( $search );
    if( !$entries )
      throw util::create( 'exception\ldap', ldap_error( $this->resource ), ldap_errno( $this->resource ) );
    
    if( 0 == $entries['count'] )
      throw util::create( 'exception\runtime', 'LDAP user '.$username.' not found.', __METHOD__ );
    
    $data = array( 'userpassword' => util::sha1_hash( $password ) );
  
    $dn = $entries[0]['dn'];
    if( !( @ldap_mod_replace( $this->resource, $dn, $data ) ) )
      throw util::create( 'exception\ldap', ldap_error( $this->resource ), ldap_errno( $this->resource ) );
  }

  /**
   * The PHP LDAP resource.
   * @var resource
   * @access private
   */
  private $resource = NULL;
  
  /**
   * The LDAP server to connect to.
   * @var string
   * @access private
   */
  private $server = 'localhost';
  
  /**
   * The LDAP port to connect to.
   * @var integer
   * @access private
   */
  private $port = 389;
  
  /**
   * The base dn to use when searching
   * @var string
   * @access private
   */
  private $base = '';
  
  /**
   * Which username to use when connecting to the manager
   * @var string
   * @access private
   */
  private $username = '';
  
  /**
   * Which password to use when connecting to the manager
   * @var string
   * @access private
   */
  private $password = '';
  
  /**
   * Whether the server is in active directory mode.
   * @var bool
   * @access private
   */
  private $active_directory = false;
}
?>
