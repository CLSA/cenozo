<?php
/**
 * ldap_manager.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\business;
use cenozo\lib, cenozo\log;

/**
 * Manages LDAP entries
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
    $setting_manager = lib::create( 'business\setting_manager' );
    $this->enabled = true === $setting_manager->get_setting( 'ldap', 'enabled' );
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
   * @access protected
   */
  protected function connect()
  {
    if( !$this->enabled ) return;
    if( is_resource( $this->resource ) ) return;

    $this->resource = ldap_connect( $this->server, $this->port );
    if( $this->active_directory )
    {
      if( false == @ldap_set_option( $this->resource, LDAP_OPT_PROTOCOL_VERSION, 3 ) )
        throw lib::create( 'exception\ldap',
          ldap_error( $this->resource ), ldap_errno( $this->resource ) );
    }

    if( !( @ldap_bind( $this->resource, $this->username, $this->password ) ) )
      throw lib::create( 'exception\ldap',
        ldap_error( $this->resource ), ldap_errno( $this->resource ) );
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
    if( !$this->enabled ) return;
    $util_class_name = lib::get_class_name( 'util' );
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
      'userpassword' => $util_class_name::sha1_hash( $password ) );
    
    $dn = sprintf( 'uid=%s,ou=Users,%s', $username, $this->base );
    if( !( @ldap_add( $this->resource, $dn, $data ) ) )
      if( 68 != ldap_errno( $this->resource ) ) // ignore already exists errors
        throw lib::create( 'exception\ldap',
          ldap_error( $this->resource ), ldap_errno( $this->resource ) );
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
    if( !$this->enabled ) return;
    $this->connect();
    
    $dn = sprintf( 'uid=%s,ou=Users,%s', $username, $this->base );
    if( !( @ldap_delete( $this->resource, $dn ) ) )
      throw lib::create( 'exception\ldap',
        ldap_error( $this->resource ), ldap_errno( $this->resource ) );
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
    if( !$this->enabled ) return false;
    $this->connect();

    $search = @ldap_search( $this->resource, $this->base, sprintf( '(&(uid=%s))', $username ) );
    if( !$search )
      throw lib::create( 'exception\ldap',
        ldap_error( $this->resource ), ldap_errno( $this->resource ) );
  
    $entries = @ldap_get_entries( $this->resource, $search );
    ldap_free_result( $search );
    if( !$entries )
      throw lib::create( 'exception\ldap',
        ldap_error( $this->resource ), ldap_errno( $this->resource ) );
  
    if( 0 == $entries['count'] )
      throw lib::create( 'exception\runtime',
        sprintf( 'User %s not found.', $username ), __METHOD__ );
  
    $dn = $entries[0]['dn'];
    $test = @ldap_bind( $this->resource, $dn, $password );

    if( !$test && 49 != ldap_errno( $this->resource ) )
      throw lib::create( 'exception\ldap',
        ldap_error( $this->resource ), ldap_errno( $this->resource ) );
    
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
    if( !$this->enabled ) return;
    $util_class_name = lib::get_class_name( 'util' );
    $this->connect();

    $search = @ldap_search( $this->resource, $this->base, sprintf( '(&(uid=%s))', $username ) );
    if( !$search )
      throw lib::create( 'exception\ldap',
        ldap_error( $this->resource ), ldap_errno( $this->resource ) );
    
    $entries = @ldap_get_entries( $this->resource, $search );
    ldap_free_result( $search );
    if( !$entries )
      throw lib::create( 'exception\ldap',
        ldap_error( $this->resource ), ldap_errno( $this->resource ) );
    
    if( 0 == $entries['count'] )
      throw lib::create( 'exception\runtime', 'LDAP user '.$username.' not found.', __METHOD__ );
    
    $data = array( 'userpassword' => $util_class_name::sha1_hash( $password ) );
  
    $dn = $entries[0]['dn'];
    if( !( @ldap_mod_replace( $this->resource, $dn, $data ) ) )
      throw lib::create( 'exception\ldap',
        ldap_error( $this->resource ), ldap_errno( $this->resource ) );
  }

  /** 
   * Whether LDAP is enabled.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @access public
   */
  public function get_enabled() { return $this->enabled; }

  /**
   * The PHP LDAP resource.
   * @var resource
   * @access protected
   */
  protected $resource = NULL;
  
  /** Whether LDAP is enabled.
   * @var boolean
   * @access private
   */
  private $enabled = false;

  /**
   * The LDAP server to connect to.
   * @var string
   * @access protected
   */
  protected $server = 'localhost';
  
  /**
   * The LDAP port to connect to.
   * @var integer
   * @access protected
   */
  protected $port = 389;
  
  /**
   * The base dn to use when searching
   * @var string
   * @access protected
   */
  protected $base = '';
  
  /**
   * Which username to use when connecting to the manager
   * @var string
   * @access protected
   */
  protected $username = '';
  
  /**
   * Which password to use when connecting to the manager
   * @var string
   * @access protected
   */
  protected $password = '';
  
  /**
   * Whether the server is in active directory mode.
   * @var bool
   * @access protected
   */
  protected $active_directory = false;
}
?>
