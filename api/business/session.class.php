<?php
/**
 * session.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\business;
use cenozo\lib, cenozo\log;

/**
 * session: handles all session-based information
 *
 * The session class is used to track all information from the time a user logs into the system
 * until they log out.
 */
class session extends \cenozo\singleton
{
  /**
   * Constructor.
   * 
   * Since this class uses the singleton pattern the constructor is never called directly.  Instead
   * use the {@link singleton} method.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function __construct( $arguments )
  {
    // WARNING!  When we construct the session we haven't finished setting up the system yet, so
    // don't use the log class in this method!

    // the first argument is the settings array from an .ini file
    $setting_manager = lib::create( 'business\setting_manager', $arguments[0] );
    
    // set error reporting
    error_reporting(
      $setting_manager->get_setting( 'general', 'development_mode' ) ? E_ALL | E_STRICT : E_ALL );
    
    // make sure pull actions don't time out
    if( 'pull' == lib::get_operation_type() ) set_time_limit( 0 );

    // setup the session variables
    if( !isset( $_SESSION['slot'] ) ) $_SESSION['slot'] = array();
  }
  
  /**
   * Initializes the session.
   * 
   * This method should be called immediately after initial construct of the session.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $site_name The name of a site to act under.  If null then a session
   *                variable will be used to determine the current site, or if not such session
   *               variable exists then a site which the user has access to will be selected
   *               automatically.
   * @param string $role_name The name of a role to act under.  If null then a session
   *               variable will be used to determine the current role, or if not such session
   *               variable exists then a role which the user has access to will be selected
   *               automatically.
   * @throws exception\permission
   * @access public
   */
  public function initialize( $site_name = NULL, $role_name = NULL )
  {
    // don't initialize more than once
    if( $this->initialized ) return;

    $setting_manager = lib::create( 'business\setting_manager' );

    // create the databases
    $this->database = lib::create( 'database\database',
      $setting_manager->get_setting( 'db', 'driver' ),
      $setting_manager->get_setting( 'db', 'server' ),
      $setting_manager->get_setting( 'db', 'username' ),
      $setting_manager->get_setting( 'db', 'password' ),
      $setting_manager->get_setting( 'db', 'database' ),
      $setting_manager->get_setting( 'db', 'prefix' ) );

    // determine the user (setting the user will also set the site and role)
    $user_name = $_SERVER[ 'PHP_AUTH_USER' ];

    $user_class_name = lib::get_class_name( 'database\user' );
    $operation_class_name = lib::get_class_name( 'database\operation' );
    $this->process_requested_site_and_role( $site_name, $role_name );
    $this->set_user( $user_class_name::get_unique_record( 'name', $user_name ) );
    if( NULL == $this->user )
      throw lib::create( 'exception\permission',
        $operation_class_name::get_operation( 'push', 'self', 'set_role' ), __METHOD__ );

    $this->initialized = true;
  }

  /**
   * Processes requested site and role and sets the session appropriately.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $site_name
   * @param string $role_name
   * @access protected
   */
  protected function process_requested_site_and_role( $site_name, $role_name )
  {
    // try and use the requested site and role, if necessary
    if( !is_null( $site_name ) && !is_null( $role_name ) )
    {
      $site_class_name = lib::get_class_name( 'database\site' );
      $this->requested_site = $site_class_name::get_unique_record( 'name', $site_name );

      $role_class_name = lib::get_class_name( 'database\role' );
      $this->requested_role = $role_class_name::get_unique_record( 'name', $role_name );
    }
  }
  
  /**
   * Get the main database.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return database
   * @access public
   */
  public function get_database()
  {
    return $this->database;
  }

  /**
   * Get the current role.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return database\role
   * @access public
   */
  public function get_role() { return $this->role; }

  /**
   * Get the current site.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return database\site
   * @access public
   */
  public function get_site() { return $this->site; }

  /**
   * Get the current user.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return database\user
   * @access public
   */
  public function get_user() { return $this->user; }

  /**
   * Get the current access.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return database\access
   * @access public
   */
  public function get_access()
  {
    if( is_null( $this->access ) )
    {
      $access_class_name = lib::get_class_name( 'database\access' );
      $this->access = $access_class_name::get_unique_record(
        array( 'user_id', 'site_id', 'role_id' ),
        array( $this->user->id, $this->site->id, $this->role->id ) );
    }

    return $this->access;
  }

  /**
   * Set the current site and role.
   * 
   * If the user does not have the proper access then nothing is changed.  
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\site $db_site
   * @param database\role $db_role
   * @param boolean $session Whether to store the site/role in the session.
   * @throws exception\permission
   * @access public
   */
  public function set_site_and_role( $db_site, $db_role, $session = true )
  {
    if( is_null( $db_site ) || is_null( $db_role ) )
    {
      $this->site = NULL;
      $this->role = NULL;
      if( $session )
      {
        unset( $_SESSION['current_site_id'] );
        unset( $_SESSION['current_role_id'] );
      }
    }
    else
    {
      // verify that the user has the right access
      if( $this->user->has_access( $db_site, $db_role ) )
      {
        $this->site = $db_site;
        $this->role = $db_role;

        if( !isset( $_SESSION['current_site_id'] ) ||
            $_SESSION['current_site_id'] != $this->site->id ||
            !isset( $_SESSION['current_role_id'] ) ||
            $_SESSION['current_role_id'] != $this->role->id )
        {
          // clean out the slot stacks
          foreach( array_keys( $_SESSION['slot'] ) as $slot ) $this->slot_reset( $slot );

          if( $session )
          {
            $_SESSION['current_site_id'] = $this->site->id;
            $_SESSION['current_role_id'] = $this->role->id;
          }
        }
      }
      else
      {
        $operation_class_name = lib::get_class_name( 'database\operation' );
        throw lib::create( 'exception\permission',
          $operation_class_name::get_operation( 'push', 'self', 'set_role' ), __METHOD__ );
      }
    }
  }

  /**
   * Set the current user.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\user $db_user
   * @throws exception\notice
   * @access public
   */
  public function set_user( $db_user )
  {
    $this->user = $db_user;

    // Determine the site and role
    if( is_null( $this->user ) )
    {
      $this->set_site_and_role( NULL, NULL );
    }
    else if( !$this->user->active )
    {
      throw lib::create( 'exception\notice',
        'Your account has been deactivated.<br>'.
        'Please contact a superior to regain access to the system.', __METHOD__ );
    }
    else
    {
      // do not use set functions or we will loose cookies
      $this->site = NULL;
      $this->role = NULL;

      // see if there is a request for a specific site and role
      if( !is_null( $this->requested_site ) && !is_null( $this->requested_role ) )
      {
        $this->set_site_and_role( $this->requested_site, $this->requested_role, false );
      }
      // see if we already have the current site stored in the php session
      else if( isset( $_SESSION['current_site_id'] ) && isset( $_SESSION['current_role_id'] ) )
      {
        try
        {
          $this->set_site_and_role(
            lib::create( 'database\site', $_SESSION['current_site_id'] ),
            lib::create( 'database\role', $_SESSION['current_role_id'] ) );
        }
        // ignore permission errors and try the code below to find access for this user
        catch( \cenozo\exception\permission $e )
        {
          // no need to log this interaction
        }
      }
      
      // we still don't have a site and role, we need to pick them
      if( is_null( $this->site ) || is_null( $this->role ) )
      {
        $db_site = NULL;
        $db_role = NULL;

        $site_list = $this->user->get_site_list();
        if( 0 == count( $site_list ) )
          throw lib::create( 'exception\notice',
            'Your account does not have access to any site.<br>'.
            'Please contact a superior to be granted access to a site.', __METHOD__ );
        
        // if the user has logged in before, use whatever site/role they last used
        $activity_mod = lib::create( 'database\modifier' );
        $activity_mod->where( 'user_id', '=', $this->user->id );
        $activity_mod->order_desc( 'datetime' );
        $activity_mod->limit( 1 );
        $activity_class_name = lib::get_class_name( 'database\activity' );
        $db_activity = current( $activity_class_name::select( $activity_mod ) );
        if( $db_activity )
        {
          // make sure the user still has access to the site/role
          $role_mod = lib::create( 'database\modifier' );
          $role_mod->where( 'site_id', '=', $db_activity->site_id );
          $role_mod->where( 'role_id', '=', $db_activity->role_id );
          $db_role = current( $this->user->get_role_list( $role_mod ) );
          
          // only bother setting the site if the access exists
          if( $db_role ) $db_site = lib::create( 'database\site', $db_activity->site_id );
        }

        // if we still don't have a site/role then load the first one we can find
        if( !$db_role || !$db_site ) 
        {
          $db_site = current( $site_list );
          $role_mod = lib::create( 'database\modifier' );
          $role_mod->where( 'site_id', '=', $db_site->id );
          $db_role = current( $this->user->get_role_list( $role_mod ) );
        }

        $this->set_site_and_role( $db_site, $db_role );
      }
    }
  }
  
  /**
   * Return whether the session has permission to perform the given operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\operation $operation If null this method returns false.
   * @return boolean
   * @access public
   */
  public function is_allowed( $operation )
  {
    return !is_null( $operation ) && !is_null( $this->role ) &&
           ( !$operation->restricted || $this->role->has_operation( $operation ) );
  }

  /**
   * Get the name of the current jquery-ui theme.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_theme()
  {
    $theme = lib::create( 'business\setting_manager' )->get_setting( 'interface', 'default_theme' );

    if( !is_null( $this->user ) )
    {
      $user_theme = $this->user->theme;
      if( !is_null( $user_theme ) ) $theme = $user_theme;
    }

    return $theme;
  }
  
  /**
   * Define the operation being performed.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param ui\operation $operation
   * @access public
   */
  public function set_operation( $operation, $arguments )
  {
    $util_class_name = lib::get_class_name( 'util' );

    // make sure we have an activity
    if( is_null( $this->activity ) )
    {
      $this->activity = lib::create( 'database\activity' );
      $this->activity->user_id = $this->user->id;
      $this->activity->site_id = $this->site->id;
      $this->activity->role_id = $this->role->id;
    }

    // add the operation to the activity and save it
    $this->activity->operation_id = $operation->get_id();
    $this->activity->query = serialize( $arguments );
    $this->activity->elapsed = $util_class_name::get_elapsed_time();
    $this->activity->datetime = $util_class_name::get_datetime_object()->format( 'Y-m-d H:i:s' );
    $this->activity->save();
  }

  /**
   * Define the error code for the current operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $error_code;
   * @access public
   */
  public function set_error_code( $error_code )
  {
    $util_class_name = lib::get_class_name( 'util' );

    // make sure we have an activity
    if( !is_null( $this->activity ) )
    {
      // add the operation to the activity and save it
      $this->activity->error_code = $error_code;
      $this->activity->elapsed = $util_class_name::get_elapsed_time();
      $this->activity->datetime = $util_class_name::get_datetime_object()->format( 'Y-m-d H:i:s' );
      $this->activity->save();
    }
  }

  /**
   * Add a new widget to the slot's stack.
   * 
   * This method will delete any items after the current pointer, add the new widget to the end of
   * the stack then point to the new element.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $slot The name of the slot.
   * @param string $name The name of the widget.
   * @param array $args An associative array containing all widget arguments.
   * @access public
   */
  public function slot_push( $slot, $name, $args = NULL )
  {
    // make sure the slot's stack has been created
    $this->validate_slot( $slot ); 
    
    // get the current index and hack off whatever comes after it
    $last_widget = false;
    $index = $_SESSION['slot'][$slot]['stack']['index'];
    if( 0 <= $index )
    {
      $_SESSION['slot'][$slot]['stack']['widgets'] =
        array_slice( $_SESSION['slot'][$slot]['stack']['widgets'], 0, $index + 1 );
      $last_widget = end( $_SESSION['slot'][$slot]['stack']['widgets'] );
    }

    // now add this widget to the end, avoiding duplicates
    if( $last_widget && $name == $last_widget['name'] )
    {
      // update the args only
      $last_index = count( $_SESSION['slot'][$slot]['stack']['widgets'] ) - 1;
      $_SESSION['slot'][$slot]['stack']['widgets'][$last_index]['args'] = $args;
    }
    else // no duplicate, add the widget to the end of the stack
    {
      $_SESSION['slot'][$slot]['stack']['widgets'][] = array( 'name' => $name, 'args' => $args );
    }

    $total = count( $_SESSION['slot'][$slot]['stack']['widgets'] );
    $_SESSION['slot'][$slot]['stack']['index'] = $total - 1;
    
    $this->update_slot_cookies();
  }

  /**
   * Returns whether or not there is a previous widget available.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return bool
   * @access public
   */
  public function slot_has_prev( $slot )
  {
    $index = $_SESSION['slot'][$slot]['stack']['index'];
    return -1 != $index && 0 <= ( $index - 1 );
  }

  /**
   * Returns whether or not there is a next widget available.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return bool
   * @access public
   */
  public function slot_has_next( $slot )
  {
    $index = $_SESSION['slot'][$slot]['stack']['index'];
    $total = count( $_SESSION['slot'][$slot]['stack']['widgets'] );
    return -1 != $index && $total > ( $index + 1 );
  }

  /**
   * Reverse the slot pointer by one.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $slot The name of the slot.
   * @return string The name of the previous widget (or NULL if there is no next widget).
   * @access public
   */
  public function slot_prev( $slot )
  {
    // make sure the slot's stack has been created
    $this->validate_slot( $slot ); 

    $value = NULL;
    
    // make sure to only decrement the index if we don't go out of bounds
    if( $this->slot_has_prev( $slot ) )
    {
      $new_index = $_SESSION['slot'][$slot]['stack']['index'] - 1;
      // update the stack index
      $_SESSION['slot'][$slot]['stack']['index'] = $new_index;
      // get the (now) previous item
      $value = $this->slot_current( $slot );
      $this->update_slot_cookies();
    }

    return $value;
  }
  
  /**
   * Advance the slot pointer by one.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $slot The name of the slot.
   * @return string The name of the next widget (or NULL if there is no next widget).
   * @access public
   */
  public function slot_next( $slot )
  {
    // make sure the slot's stack has been created
    $this->validate_slot( $slot ); 

    $value = NULL;
    
    // make sure to only increment the index if we don't go out of bounds
    if( $this->slot_has_next( $slot ) )
    {
      $new_index = $_SESSION['slot'][$slot]['stack']['index'] + 1;
      // update the stack index
      $_SESSION['slot'][$slot]['stack']['index'] = $new_index;
      // get the (now) next item
      $value = $this->slot_current( $slot );
      $this->update_slot_cookies();
    }

    return $value;
  }

  /**
   * Returns the widget currently being pointed to by the slot stack.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $slot The name of the slot.
   * @return array The name and arguments of the widget or NULL if the stack is empty.
   *               The associative array includes:
                   "name" => string,
                   "args" => associative array
   * @access public
   */
  public function slot_current( $slot )
  {
    // make sure the slot's stack has been created
    $this->validate_slot( $slot ); 
    // return the item at the current index
    $index = $_SESSION['slot'][$slot]['stack']['index'];
    return 0 <= $index ? $_SESSION['slot'][$slot]['stack']['widgets'][$index] : NULL;
  }

  /**
   * Resets the slot stacks to their initial state.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $slot The name of the slot.
   * @return string The name of the widget or NULL if the stack is empty.
   * @access public
   */
  public function slot_reset( $slot )
  {
    if( 'main' == $slot )
    {
      // by default, if there is no widget in the main slot then start with home
      $_SESSION['slot'][$slot]['stack']['index'] = 0;
      $_SESSION['slot'][$slot]['stack']['widgets'] =
        array( array( 'name' => 'self_home', 'args' => NULL ) );
    }
    else if( 'settings' == $slot )
    {
      $_SESSION['slot'][$slot]['stack']['index'] = 0;
      $_SESSION['slot'][$slot]['stack']['widgets'] =
        array( array( 'name' => 'self_settings', 'args' => NULL ) );
    }
    else if( 'menu' == $slot )
    {
      $_SESSION['slot'][$slot]['stack']['index'] = 0;
      $_SESSION['slot'][$slot]['stack']['widgets'] =
        array( array( 'name' => 'self_menu', 'args' => NULL ) );
    }
    else if( 'status' == $slot )
    {
      $_SESSION['slot'][$slot]['stack']['index'] = 0;
      $_SESSION['slot'][$slot]['stack']['widgets'] =
        array( array( 'name' => 'self_status', 'args' => NULL ) );
    }
    else if( 'shortcuts' == $slot )
    {
      $_SESSION['slot'][$slot]['stack']['index'] = 0;
      $_SESSION['slot'][$slot]['stack']['widgets'] =
        array( array( 'name' => 'self_shortcuts', 'args' => NULL ) );
    }
    else
    {
      $_SESSION['slot'][$slot]['stack']['index'] = -1;
      $_SESSION['slot'][$slot]['stack']['widgets'] = array();
    }

    $this->update_slot_cookies();
  }

  /**
   * Makes sure that a stack exists for the given slot.
   * 
   * @author Patrick Emond <emondpd@mcamster.ca>
   * @access protected
   */
  protected function validate_slot( $slot )
  {
    if( !isset( $_SESSION['slot'][$slot] ) ) $this->slot_reset( $slot );
  }

  /**
   * Writes all slot stack information as cookies.
   * 
   * @author Patrick Emond <emondpd@mcamster.ca>
   * @access protected
   */
  protected function update_slot_cookies()
  {
    foreach( array_keys( $_SESSION['slot'] ) as $slot )
    {
      $widget = $this->slot_current( $slot );
      setcookie( 'slot__'.$slot.'__widget', $widget['name'], 0, COOKIE_PATH );
      
      $index = $_SESSION['slot'][$slot]['stack']['index'];

      setcookie( 'slot__'.$slot.'__prev', $this->slot_has_prev( $slot ) ?
        $_SESSION['slot'][$slot]['stack']['widgets'][$index-1]['name'] : NULL, 0, COOKIE_PATH );

      setcookie( 'slot__'.$slot.'__next', $this->slot_has_next( $slot ) ?
        $_SESSION['slot'][$slot]['stack']['widgets'][$index+1]['name'] : NULL, 0, COOKIE_PATH );
    }
  }

  /**
   * Returns whether to use a database transaction.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @access public
   */
  public function use_transaction()
  {
    return $this->transaction;
  }

  /**
   * Set whether to use a database transaction.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param boolean $transaction
   * @access public
   */
  public function set_use_transaction( $use )
  {
    $this->transaction = $use;
  }

  /**
   * Returns whether the session has been initialized or not.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @access public
   */
  public function is_initialized()
  {
    return $this->initialized;
  }

  /**
   * Whether the session has been initialized
   * @var boolean
   * @access private
   */
  private $initialized = false;

  /**
   * The main database object.
   * @var database
   * @access private
   */
  private $database = NULL;

  /**
   * The record of the current user.
   * @var database\user
   * @access private
   */
  private $user = NULL;

  /**
   * The record of the current role.
   * @var database\role
   * @access private
   */
  private $role = NULL;

  /**
   * The record of the current site.
   * @var database\site
   * @access private
   */
  private $site = NULL;

  /**
   * The record of the requested role.
   * @var database\role
   * @access private
   */
  protected $requested_role = NULL;

  /**
   * The record of the requested site.
   * @var database\site
   * @access private
   */
  protected $requested_site = NULL;

  /**
   * The record of the current access (determined the first time get_access() is called)
   * @var database\access
   * @access private
   */
  private $access = NULL;

  /**
   * The activity associated with the current operation.
   * @var database\activity
   * @access private
   */
  private $activity = NULL;

  /**
   * Whether a database transaction needs to be performed during this session.
   * @var boolean
   * @access private
   */
  private $transaction = false;
}
?>
