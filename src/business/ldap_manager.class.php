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
    $this->type = $setting_manager->get_setting( 'ldap', 'type' );
    $this->timeout = $setting_manager->get_setting( 'ldap', 'timeout' );
    $this->group = lib::create( 'business\session' )->get_database()->get_name();

    /* TODO
    if( 'samba' == $this->type )
    {
      // make sure the group exists
      if( !$this->group_exists( $this->group ) ) $this->new_group( $this->group );
    }
    */
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
    if( 'active' == $this->type )
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
   * Creates a new group.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $group The new group to create
   * @param string $description The group's description
   * @access public
   */
  public function new_group( $name, $description )
  {
    if( !$this->enabled ) return;

    if( 'samba' == $this->type )
    {
      // command: group add "GROUP NAME"
      // arguments: --group-type="Distribution" --description="DESCRIPTION"
      // error response:
      // succesROR(ldb): Failed to create group "GROUP NAME" - LDAP error 68 LDAP_ENTRY_ALREADY_EXISTS - \
      //                 <00002071: samldb: Account name (sAMAccountName) 'GROUP NAME' already in use!> <>
      // success response: Added GROUP NAME group
      $command = sprintf( 'group add "%s" --group-type="Distribution" --description="%s"', $name, $description );
      
      $command = sprintf( 'timeout %d samba-tool %s --URL="ldap://%s" --username="%s" --password="%s"',
                          $this->timeout,
                          $command,
                          $this->server,
                          $this->username,
                          $this->password );
      $output = '';
      $return_var = NULL;
      exec( $command, $output, $return_var );
      log::debug( array(
        'output' => $output,
        'return_var' => $return_var ) );
    }
    else
    {
      throw lib::create( 'exception\runtime',
        'LDAP groups are only used for type "samba"',
        __METHOD__ );
    }
  }

  /**
   * Deletes a group.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $group The group to delete
   * @access public
   */
  public function delete_group( $name )
  {
    if( !$this->enabled ) return;

    if( 'samba' == $this->type )
    {
      // command: group delete "GROUP NAME"
      // error response:
      // ERROR(exception): Failed to remove group GROUP NAME - Unable to find group GROUP NAME
      //  File "/usr/lib/python2.7/dist-packages/samba/netcmd/group.py", line 166, in run
      //    samdb.deletegroup(groupname)
      //  File "/usr/lib/python2.7/dist-packages/samba/samdb.py", line 220, in deletegroup
      //    raise Exception('Unable to find group "%s"' % groupname)
      // success response: Deleted group "GROUP NAME"
      $command = sprintf( 'group delete "%s"', $name );
      
      $command = sprintf( 'timeout %d samba-tool %s --URL="ldap://%s" --username="%s" --password="%s"',
                          $this->timeout,
                          $command,
                          $this->server,
                          $this->username,
                          $this->password );
      $output = '';
      $return_var = NULL;
      exec( $command, $output, $return_var );
      log::debug( array(
        'output' => $output,
        'return_var' => $return_var ) );
    }
    else
    {
      throw lib::create( 'exception\runtime',
        'LDAP groups are only used for type "samba"',
        __METHOD__ );
    }
  }

  /**
   * Determines whether a group exists
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $group The group to search for
   * @access public
   */
  public function group_exists( $name )
  {
    if( !$this->enabled ) return;

    $result = false;
    if( 'samba' == $this->type )
    {
      // command: command: group list
      // response: list of all groups
      $command = sprintf( 'group list | grep "^%s$"', $group );
      
      $command = sprintf( 'timeout %d samba-tool %s --URL="ldap://%s" --username="%s" --password="%s"',
                          $this->timeout,
                          $command,
                          $this->server,
                          $this->username,
                          $this->password );
      $output = '';
      $return_var = NULL;
      exec( $command, $output, $return_var );
      log::debug( array(
        'output' => $output,
        'return_var' => $return_var ) );
    }
    else
    {
      throw lib::create( 'exception\runtime',
        'LDAP groups are only used for type "samba"',
        __METHOD__ );
    }

    return $result;
  }

  /**
   * Determines whether a user belongs to a group
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $group The group to search in
   * @param string $username The user to search for
   * @access public
   */
  public function user_exists_in_group( $username, $group )
  {
    if( !$this->enabled ) return;

    $result = false;
    if( 'samba' == $this->type )
    {
      // command: group listmembers "GROUP NAME"
      // response: list
      $command = sprintf( 'group listmembers "%s" | grep "^%s$"', $group, $username );
      
      $command = sprintf( 'timeout %d samba-tool %s --URL="ldap://%s" --username="%s" --password="%s"',
                          $this->timeout,
                          $command,
                          $this->server,
                          $this->username,
                          $this->password );
      $output = '';
      $return_var = NULL;
      exec( $command, $output, $return_var );
      log::debug( array(
        'output' => $output,
        'return_var' => $return_var ) );
    }
    else
    {
      throw lib::create( 'exception\runtime',
        'LDAP groups are only used for type "samba"',
        __METHOD__ );
    }

    return $result;
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

    if( 'samba' == $this->type )
    {
      // command: user create USERNAME "password"
      // arguments: --given-name="John" --surname="Smith"
      // on success: User 'USERNAME' created successfully
      // on error: ERROR(ldb): Failed to add user 'USERNAME':  - LDAP error 68 LDAP_ENTRY_ALREADY_EXISTS - \
      //           <00002071: samldb: Account name (sAMAccountName) 'USERNAME' already in use!> <> 
      $command = sprintf( 'user create "%s" "%s" --given-name="%s" --surname="%s"',
                          $username,
                          $password,
                          $first_name,
                          $last_name );
      
      $command = sprintf( 'timeout %d samba-tool %s --URL="ldap://%s" --username="%s" --password="%s"',
                          $this->timeout,
                          $command,
                          $this->server,
                          $this->username,
                          $this->password );
      $output = '';
      $return_var = NULL;
      exec( $command, $output, $return_var );
      log::debug( array(
        'output' => $output,
        'return_var' => $return_var ) );
    }
    else
    {
      $this->connect();

      $data = array (
        'cn' => $first_name.' '.$last_name,
        'sn' => $last_name,
        'givenname' => $first_name,
        'sAMAccountName' => $username,
        'objectClass' => array (
          'inetOrgPerson',
          'passwordHolder' ),
        'description' => 'clsa',
        'userpassword' => $util_class_name::sha1_hash( $password ) );

      $dn = sprintf( 'sAMAccountName=%s,ou=Users,%s', $username, $this->base );
      if( !( @ldap_add( $this->resource, $dn, $data ) ) )
        if( 68 != ldap_errno( $this->resource ) ) // ignore already exists errors
          throw lib::create( 'exception\ldap',
            ldap_error( $this->resource ), ldap_errno( $this->resource ) );
    }
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

    if( 'samba' == $this->type )
    {
      // command: user delete USERNAME
      // error response: 
      // ERROR(exception): Failed to remove user "USERNAME" - Unable to find user "USERNAME"
      //   File "/usr/lib/python2.7/dist-packages/samba/netcmd/user.py", line 238, in run
      //     samdb.deleteuser(username)
      //   File "/usr/lib/python2.7/dist-packages/samba/samdb.py", line 449, in deleteuser
      //     raise Exception('Unable to find user "%s"' % username)
      // success response: Deleted user USERNAME 
      $command = sprintf( 'user delete "%s"', $username );

      $command = sprintf( 'timeout %d samba-tool %s --URL="ldap://%s" --username="%s" --password="%s"',
                          $this->timeout,
                          $command,
                          $this->server,
                          $this->username,
                          $this->password );
      $output = '';
      $return_var = NULL;
      exec( $command, $output, $return_var );
      log::debug( array(
        'output' => $output,
        'return_var' => $return_var ) );
    }
    else
    {
      $this->connect();

      $dn = sprintf( 'sAMAccountName=%s,ou=Users,%s', $username, $this->base );
      if( !( @ldap_delete( $this->resource, $dn ) ) )
        throw lib::create( 'exception\ldap',
          ldap_error( $this->resource ), ldap_errno( $this->resource ) );
    }
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

    $result = false;

    if( 'samba' == $this->type )
    {
      // try any command to test user/pass, if valid the return var will be 0
      $command = sprintf( 'timeout %d samba-tool group list --URL="ldap://%s" --username="%s" --password="%s"',
                          $this->timeout,
                          $this->server,
                          $username,
                          $password );
      $output = '';
      $return_var = NULL;
      exec( $command, $output, $return_var );
      $result = 0 == $return_var;
    }
    else
    {
      $this->connect();

      $search = @ldap_search( $this->resource, $this->base, sprintf( '(&(sAMAccountName=%s))', $username ) );
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
      $result = @ldap_bind( $this->resource, $dn, $password );

      if( !$result && 49 != ldap_errno( $this->resource ) )
        throw lib::create( 'exception\ldap',
          ldap_error( $this->resource ), ldap_errno( $this->resource ) );
    }

    return $result;
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

    if( 'samba' == $this->type )
    {
      // command: user setpassword "USERNAME" --newpassword="PASSWORD"
      // error response: (may timeout if newpassword is empty string)
      // ERROR: Failed to set password for user 'USERNAME2': Unable to find user "USERNAME2"
      // success response: Changed password OK 
      $command = sprintf( 'user setpassword "%s" --newpassword="%s"', $username, $password );
      
      $command = sprintf( 'timeout %d samba-tool %s --URL="ldap://%s" --username="%s" --password="%s"',
                          $this->timeout,
                          $command,
                          $this->server,
                          $this->username,
                          $this->password );
      $output = '';
      $return_var = NULL;
      exec( $command, $output, $return_var );
      if( 0 != $return_var )
        throw lib::create( 'exception\ldap', 'Unable to change user password', $return_var );
    }
    else
    {
      $this->connect();

      $search = @ldap_search( $this->resource, $this->base, sprintf( '(&(sAMAccountName=%s))', $username ) );
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
   * What type of connection to use.
   * @var bool
   * @access protected
   */
  protected $type = 'standard';

  /**
   * How many seconds to wait before giving up on ldap commands
   * @var integer $timeout
   * @access protected
   */
  protected $timeout = 10;

  /**
   * The name of the ldap group to reference users in for this application
   * (Note, this will always be the same as the main database name)
   * @var string $group
   * @access protected
   */
  protected $group = NULL;
}
