<?php
/**
 * ldap_manager.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
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
  }

  /**
   * Destructor which unbinds the LDAP connection, if one exists
   * 
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
   * Creates a new user.
   * 
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
      // arguments: --use-username-as-cn
      // on success: User 'USERNAME' created successfully
      // on error: ERROR(ldb): Failed to add user 'USERNAME':  - LDAP error 68 LDAP_ENTRY_ALREADY_EXISTS - \
      //           <00002071: samldb: Account name (sAMAccountName) 'USERNAME' already in use!> <>
      $command = sprintf( 'user create "%s" "%s" --use-username-as-cn',
                          $username,
                          $password,
                          $first_name,
                          $last_name );

      $command = sprintf( 'samba-tool %s --URL="ldap://%s" --username="%s" --password="%s"',
                          $command,
                          $this->server,
                          $this->username,
                          $this->password );

      try
      {
        $result = $util_class_name::exec_timeout( $command, $this->timeout );
      }
      catch( \cenozo\exception\runtime $e )
      {
        // convert the timeout to an ldap error
        throw lib::create( 'exception\ldap',
          'The LDAP server failed to respond within the allowed time limit.', 3 );
      }

      if( 0 != $result['exitcode'] )
      {
        // LDAP sometimes responds with a non 0 code even upon success
        if( 1 > preg_match( '/User .* created successfully/', $result['output'] ) )
        {
          $code = false !== strpos( $result['output'], 'LDAP_ENTRY_ALREADY_EXISTS' ) ? 68 : $result['exitcode'];
          throw lib::create( 'exception\ldap', $result['output'], $code );
        }
      }
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
   * @param string $username The username to delete
   * @throws exception\ldap
   * @access public
   */
  public function delete_user( $username )
  {
    if( !$this->enabled ) return;
    $util_class_name = lib::get_class_name( 'util' );

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

      $command = sprintf( 'samba-tool %s --URL="ldap://%s" --username="%s" --password="%s"',
                          $command,
                          $this->server,
                          $this->username,
                          $this->password );

      try
      {
        $result = $util_class_name::exec_timeout( $command, $this->timeout );
      }
      catch( \cenozo\exception\runtime $e )
      {
        // convert the timeout to an ldap error
        throw lib::create( 'exception\ldap',
          'The LDAP server failed to respond within the allowed time limit.', 3 );
      }

      if( 0 != $result['exitcode'] )
      {
        $code = false !== strpos( $result['output'], 'Unable to find user' ) ? 32 : $result['exitcode'];
        throw lib::create( 'exception\ldap', $result['output'], $code );
      }
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
   * @param string $username
   * @param string $password
   * @throws exception\ldap, exception\runtime
   * @return boolean
   * @access public
   */
  public function validate_user( $username, $password )
  {
    if( !$this->enabled ) return false;
    $util_class_name = lib::get_class_name( 'util' );

    $valid = false;

    if( 'samba' == $this->type )
    {
      // try any command to test user/pass, if valid the return var will be 0
      $command = sprintf( 'samba-tool gpo list "%s" --URL="ldap://%s" --username="%s" --password="%s"',
                          $username,
                          $this->server,
                          $username,
                          $password );

      try
      {
        $result = $util_class_name::exec_timeout( $command, $this->timeout );
      }
      catch( \cenozo\exception\runtime $e )
      {
        // convert the timeout to an ldap error
        throw lib::create( 'exception\ldap',
          'The LDAP server failed to respond within the allowed time limit.', 3 );
      }

      // handle connection refused
      if( false !== strpos( $result['output'], 'NT_STATUS_CONNECTION_REFUSED' ) ||
          false !== strpos( $result['output'], 'NT_STATUS_HOST_UNREACHABLE' ) )
      {
        throw lib::create( 'exception\ldap', 'Unable to connect to the LDAP server.', 255 );
      }

      // ignore errors caused by invalid credentials
      $valid = false !== strpos( $result['output'], sprintf( 'GPOs for user %s', $username ) );

      // fix the double-password issue
      if( $valid )
      {
        $this->set_user_password( $username, $password );
      }
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
      $valid = @ldap_bind( $this->resource, $dn, $password );

      if( !$valid && 49 != ldap_errno( $this->resource ) )
        throw lib::create( 'exception\ldap',
          ldap_error( $this->resource ), ldap_errno( $this->resource ) );
    }

    return $valid;
  }

  /**
   * Sets a user's password
   * 
   * @param string $username Which user to affect
   * @param string $password The new password for the account
   * @throws exception\ldap, exception\runtime
   * @access public
   */
  public function set_user_password( $username, $password )
  {
    if( !$this->enabled ) return;
    $util_class_name = lib::get_class_name( 'util' );
    $user_class_name = lib::get_class_name( 'database\user' );

    if( 'samba' == $this->type )
    {
      // command: user setpassword "USERNAME" --newpassword="PASSWORD"
      // error response: (may timeout if newpassword is empty string)
      // ERROR: Failed to set password for user 'USERNAME2': Unable to find user "USERNAME2"
      // success response: Changed password OK
      $command = sprintf( 'user setpassword "%s" --newpassword="%s"', $username, $password );

      $command = sprintf( 'samba-tool %s --URL="ldap://%s" --username="%s" --password="%s"',
                          $command,
                          $this->server,
                          $this->username,
                          $this->password );

      try
      {
        // run twice to fix the double-password issue
        $util_class_name::exec_timeout( $command, $this->timeout );
        $result = $util_class_name::exec_timeout( $command, $this->timeout );
      }
      catch( \cenozo\exception\runtime $e )
      {
        // convert the timeout to an ldap error
        throw lib::create( 'exception\ldap',
          'The LDAP server failed to respond within the allowed time limit.', 3 );
      }

      if( false !== strstr( $result['output'], 'Unable to find user' ) )
      {
        // user doesn't exist, try creating it
        $db_user = $user_class_name::get_unique_record( 'name', $username );
        if( !is_null( $db_user ) )
        {
          $this->new_user( $username, $db_user->first_name, $db_user->last_name, $password );
          $result['exitcode'] = 0;
        }
      }

      if( 0 != $result['exitcode'] && !preg_match( '/Changed password OK/', $result['output'] ) )
        throw lib::create( 'exception\ldap', $result['output'], $result['exitcode'] );
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
  protected $timeout = NULL;
}
