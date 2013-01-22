<?php
/**
 * user_new.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: user new
 *
 * Create a new user.
 */
class user_new extends base_new
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments.
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'user', $args );
  }

  /**
   * Sets up the operation with any pre-execution instructions that may be necessary.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();

    $columns = $this->get_argument( 'columns' );

    // remove the role and site ids from the columns and store them as ivars
    if( array_key_exists( 'role_id', $columns ) )
    {
      $this->role_id = $columns['role_id'];
      unset( $this->arguments['columns']['role_id'] );
    }
    
    if( array_key_exists( 'site_id', $columns ) )
    {
      $this->site_id = $columns['site_id'];
      unset( $this->arguments['columns']['site_id'] );
    }
  }

  /**
   * Validate the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\notice
   * @access protected
   */
  protected function validate()
  {
    parent::validate();

    $columns = $this->get_argument( 'columns' );

    // make sure the name, first name and last name are not blank
    if( !array_key_exists( 'name', $columns ) || 0 == strlen( $columns['name'] ) )
      throw lib::create( 'exception\notice',
        'The user\'s user name cannot be left blank.', __METHOD__ );
    if( !array_key_exists( 'first_name', $columns ) || 0 == strlen( $columns['first_name'] ) )
      throw lib::create( 'exception\notice',
        'The user\'s first name cannot be left blank.', __METHOD__ );
    if( !array_key_exists( 'last_name', $columns ) || 0 == strlen( $columns['last_name'] ) )
      throw lib::create( 'exception\notice',
        'The user\'s last name cannot be left blank.', __METHOD__ );
  }

  /**
   * This method executes the operation's purpose.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function execute()
  {
    $columns = $this->get_argument( 'columns' );

    // add the user to ldap
    $ldap_manager = lib::create( 'business\ldap_manager' );
    try
    {
      $ldap_manager->new_user(
        $columns['name'], $columns['first_name'], $columns['last_name'], 'password' );
    }
    catch( \cenozo\exception\ldap $e )
    {
      // catch already exists exceptions, no need to report them
      if( !$e->is_already_exists() ) throw $e;
    }

    // create the database record
    parent::execute();

    if( !is_null( $this->site_id ) && !is_null( $this->role_id ) )
    { // add the initial role to the new user
      $util_class_name = lib::get_class_name( 'util' );
      $user_class_name = lib::get_class_name( 'database\user' );

      $db_user = $user_class_name::get_unique_record( 'name', $columns['name'] );
      if( $user_class_name::column_exists( 'password' ) )
      {
        $db_user->password = $util_class_name::encrypt( 'password' );
        $db_user->save();
      }
      $db_access = lib::create( 'database\access' );
      $db_access->user_id = $db_user->id;
      $db_access->site_id = $this->site_id;
      $db_access->role_id = $this->role_id;

      try
      {
        $db_access->save();
      }
      catch( \cenozo\exception\database $e )
      { // ignore unique error if this was a machine request
        if( !$e->is_duplicate_entry() ||
            !$this->get_machine_request_received() ) throw $e;
      }
    }
  }

  /**
   * The initial site to give the new user access to
   * @var int
   * @access protected
   */
  protected $site_id = NULL;

  /**
   * The initial role to give the new user
   * @var int
   * @access protected
   */
  protected $role_id = NULL;
}
?>
