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
  }
  
  /**
   * Initializes the session.
   * 
   * This method should be called immediately after initial construct of the session.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param int/string $site The id or name of a site to act under.  If null then a session
   *                   variable will be used to determine the current site, or if not such session
   *                   variable exists then a site which the user has access to will be selected
   *                   automatically.
   * @param int/string $role The id or name of a role to act under.  If null then a session
   *                   variable will be used to determine the current role, or if not such session
   *                   variable exists then a role which the user has access to will be selected
   *                   automatically.
   * @throws exception\permission
   * @access public
   */
  public function initialize( $site = NULL, $role = NULL )
  {
    // don't initialize more than once
    if( $this->initialized ) return;

    $application_class_name = lib::get_class_name( 'database\application' );

    $setting_manager = lib::create( 'business\setting_manager' );

    // create the database object
    $this->database = lib::create( 'database\database',
      $setting_manager->get_setting( 'db', 'server' ),
      $setting_manager->get_setting( 'db', 'username' ),
      $setting_manager->get_setting( 'db', 'password' ),
      sprintf( '%s%s', $setting_manager->get_setting( 'db', 'database_prefix' ), INSTANCE ),
      $setting_manager->get_setting( 'db', 'prefix' ) );

    // define the application's application
    $this->application = $application_class_name::get_unique_record( 'name', INSTANCE, true );

    // determine the user (setting the user will also set the site and role)
    $user_name = $_SERVER[ 'PHP_AUTH_USER' ];

    $user_class_name = lib::get_class_name( 'database\user' );
    $operation_class_name = lib::get_class_name( 'database\operation' );
    $this->process_requested_site_and_role( $site, $role );
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
   * @param int/string $site
   * @param int/string $role
   * @access protected
   */
  protected function process_requested_site_and_role( $site, $role )
  {
    // try and use the requested site and role, if necessary
    if( !is_null( $site ) && !is_null( $role ) )
    {
      $util_class_name = lib::get_class_name( 'util' );

      if( $util_class_name::string_matches_int( $site ) )
      {
        $this->requested_site = lib::create( 'database\site', $site );
      }
      else
      {
        $site_class_name = lib::get_class_name( 'database\site' );
        $this->requested_site = $site_class_name::get_unique_record(
          array( 'application_id', 'name' ),
          array( $this->application->id, $site ) );
      }

      if( $util_class_name::string_matches_int( $role ) )
      {
        $this->requested_role = lib::create( 'database\role', $role );
      }
      else
      {
        $role_class_name = lib::get_class_name( 'database\role' );
        $this->requested_role = $role_class_name::get_unique_record( 'name', $role );
      }
    }
  }

  /**
   * Get the database object
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
   * Get the current user.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return database\user
   * @access public
   */
  public function get_user() { return $this->user; }

  /**
   * Get the current site.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return database\site
   * @access public
   */
  public function get_site() { return $this->site; }

  /**
   * Get the current application.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return database\application
   * @access public
   */
  public function get_application() { return $this->application; }

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
        $activity_mod->where( 'activity.user_id', '=', $this->user->id );
        $activity_mod->order_desc( 'datetime' );
        $activity_mod->limit( 1 );
        $activity_class_name = lib::get_class_name( 'database\activity' );
        $db_activity = current( $activity_class_name::select( $activity_mod ) );
        if( $db_activity )
        {
          // make sure the user still has access to the site/role
          $role_mod = lib::create( 'database\modifier' );
          $role_mod->where( 'access.site_id', '=', $db_activity->site_id );
          $role_mod->where( 'access.role_id', '=', $db_activity->role_id );
          $db_role = current( $this->user->get_role_list( $role_mod ) );
          
          // only bother setting the site if the access exists
          if( $db_role ) $db_site = lib::create( 'database\site', $db_activity->site_id );
        }

        // if we still don't have a site/role then load the first one we can find
        if( !$db_role || !$db_site ) 
        {
          $db_site = current( $site_list );
          $role_mod = lib::create( 'database\modifier' );
          $role_mod->where( 'access.site_id', '=', $db_site->id );
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
  public function is_operation_allowed( $operation )
  {
    return !is_null( $operation ) && !is_null( $this->role ) &&
           ( !$operation->restricted || $this->role->has_operation( $operation ) );
  }

  /**
   * Return whether the session has permission to perform the given service.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\service $service If null this method returns false.
   * @return boolean
   * @access public
   */
  public function is_service_allowed( $service )
  {
    return !is_null( $service ) && !is_null( $this->role ) &&
           ( !$service->restricted || $this->role->has_service( $service ) );
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
      $user_theme = $this->user->get_theme( $this->application );
      if( !is_null( $user_theme ) ) $theme = $user_theme;
    }

    return $theme;
  }

  /**
   * Set the current jquery-ui theme.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $theme
   * @access public
   */
  public function set_theme( $theme )
  {
    $this->user->set_theme( $this->application, $theme );
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
    $this->activity->query = in_array( $operation->get_full_name(), $this->censored_operation_list )
                           ? '(censored)'
                           : serialize( $arguments );
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
   * A list of all operations who's query values are to be censored when writing to the activity log
   * @var array
   * @access protected
   */
  protected $censored_operation_list = array( 'self_set_password', 'user_set_password' );

  /**
   * Whether the session has been initialized
   * @var boolean
   * @access private
   */
  private $initialized = false;

  /**
   * The application's database object.
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
   * The record of the current application.
   * @var database\application
   * @access private
   */
  private $application = NULL;

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
