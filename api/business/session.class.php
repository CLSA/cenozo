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

    $this->state = 'created';
  }
  
  /**
   * Initializes the session.
   * 
   * This method should be called immediately after initial construct of the session.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\permission
   * @access public
   */
  public function initialize()
  {
    // only initialize once and after construction only
    if( 'created' != $this->state ) return;

    $application_class_name = lib::get_class_name( 'database\application' );
    $user_class_name = lib::get_class_name( 'database\user' );
    $activity_class_name = lib::get_class_name( 'database\activity' );
    $util_class_name = lib::get_class_name( 'util' );

    $setting_manager = lib::create( 'business\setting_manager' );

    // create the database object
    $this->database = lib::create( 'database\database',
      $setting_manager->get_setting( 'db', 'server' ),
      $setting_manager->get_setting( 'db', 'username' ),
      $setting_manager->get_setting( 'db', 'password' ),
      sprintf( '%s%s', $setting_manager->get_setting( 'db', 'database_prefix' ), INSTANCE ) );

    // define the application's application
    $this->db_application = $application_class_name::get_unique_record( 'name', INSTANCE );
    if( is_null( $this->db_application ) )
      throw lib::create( 'exception\runtime',
        'Failed to find application record in database, please check general/instance_name '.
        'setting in application\'s settings.local.ini.php file',
        __METHOD__ );

    // determine the user (and from it, the site and role)
    $user_name = $_SERVER[ 'PHP_AUTH_USER' ];

    $this->set_user( $user_class_name::get_unique_record( 'name', $user_name ) );
    if( is_null( $this->db_user ) )
      throw lib::create( 'exception\notice',
        'Your account does not exist.<br>'.
        'Please contact an account administrator to gain access to the system.',
        __METHOD__ );

    // close any lapsed activity
    $activity_class_name::close_lapsed();

    // create a new activity if there isn't already one open
    $activity_mod = lib::create( 'database\modifier' );
    $activity_mod->where( 'user_id', '=', $this->db_user->id );
    $activity_mod->where( 'site_id', '=', $this->db_site->id );
    $activity_mod->where( 'role_id', '=', $this->db_role->id );
    $activity_mod->where( 'end_datetime', '=', NULL );
    if( 0 == $this->db_user->get_activity_count( $activity_mod ) )
    {
      $db_activity = lib::create( 'database\activity' );
      $db_activity->user_id = $this->db_user->id;
      $db_activity->site_id = $this->db_site->id;
      $db_activity->role_id = $this->db_role->id;
      $db_activity->start_datetime = $util_class_name::get_datetime_object();
      $db_activity->save();
    }

    // update the access with the current time
    $this->mark_access_time();

    $this->state = 'initialized';
  }
  
  /**
   * Ends the session.
   * 
   * This method should be called after the operation is performed
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function shutdown()
  {
    // only shutdown after initialization
    if( 'initialized' != $this->state ) return;

    $this->state = 'shutdown';
  }

  /**
   * Get the database object
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return database
   * @access public
   */
  public function get_database() { return $this->database; }

  /**
   * Get the current application.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return database\application
   * @access public
   */
  public function get_application() { return $this->db_application; }

  /**
   * Get the current role.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return database\role
   * @access public
   */
  public function get_role() { return $this->db_role; }

  /**
   * Get the current user.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return database\user
   * @access public
   */
  public function get_user() { return $this->db_user; }

  /**
   * Get the current site.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return database\site
   * @access public
   */
  public function get_site() { return $this->db_site; }

  /**
   * Change the user's active site and role
   * 
   * Will return whether the user has access to the site/role pair
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\site $db_site
   * @param database\role $db_role
   * @access public
   */
  public function set_site_and_role( $db_site = NULL, $db_role = NULL )
  {
    // only perform if not shut down
    if( $this->is_shutdown() ) return;

    if( !is_null( $db_site ) && !is_a( $db_site, lib::get_class_name( 'database\site' ) ) )
      throw lib::create( 'exception\argument', 'db_site', $db_site, __METHOD__ );
    if( !is_null( $db_role ) && !is_a( $db_role, lib::get_class_name( 'database\role' ) ) )
      throw lib::create( 'exception\argument', 'db_role', $db_role, __METHOD__ );

    $has_access = false;
    if( !is_null( $this->db_user ) )
    {
      $access_class_name = lib::get_class_name( 'database\access' );
      $util_class_name = lib::get_class_name( 'util' );

      // automatically determine site or role if either is not provided
      if( is_null( $db_site ) || is_null( $db_role ) )
      {
        // find the most recent access restricted to the given site/role (if any)
        $access_mod = lib::create( 'database\modifier' );
        $access_mod->join( 'site', 'access.site_id', 'site.id' );
        $access_mod->where( 'site.application_id', '=', $this->db_application->id );
        $access_mod->order_desc( 'datetime' );
        $access_mod->order_desc( 'microtime' );
        $access_mod->limit( 1 );
        if( !is_null( $db_site ) ) $access_mod->where( 'site_id', '=', $db_site->id );
        if( !is_null( $db_role ) ) $access_mod->where( 'role_id', '=', $db_role->id );
        $this->db_access = current( $this->db_user->get_access_object_list( $access_mod ) );
        if( !is_null( $this->db_access ) )
        {
          $db_site = $this->db_access->get_site();
          $db_role = $this->db_access->get_role();
        }
      }

      // may not have resolved a site/role pair, so double check
      if( !is_null( $db_site ) && !is_null( $db_role ) )
      {
        $has_access = $this->db_user->has_access( $db_site, $db_role );
        if( $has_access )
        {
          $this->db_site = $db_site;
          $this->db_role = $db_role;
          if( is_null( $this->db_access ) )
            $this->db_access = $access_class_name::get_unique_record(
              array( 'user_id', 'site_id', 'role_id' ),
              array( $this->db_user->id, $this->db_site->id, $this->db_role->id ) );
        }
      }
    }

    return $has_access;
  }

  /**
   * Set the current user.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\user $db_user
   * @throws exception\notice
   * @throws exception\permission
   * @access public
   */
  public function set_user( $db_user )
  {
    // only perform if not shut down
    if( $this->is_shutdown() ) return;

    $this->db_user = $db_user;
    if( !$this->db_user->active )
    {
      throw lib::create( 'exception\notice',
        'Your account has been deactivated.<br>'.
        'Please contact your account administrator to regain access to the system.', __METHOD__ );
    }

    $this->set_site_and_role();
  }
  
  /**
   * Updates the access record with the current time
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function mark_access_time()
  {
    if( !is_null( $this->db_access ) )
    {
      $util_class_name = lib::get_class_name( 'util' );
      $microtime = microtime();
      $this->db_access->datetime = $util_class_name::get_datetime_object();
      $this->db_access->microtime = substr( $microtime, 0, strpos( $microtime, ' ' ) );
      $this->db_access->save();
    }
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
    return !is_null( $service ) && !is_null( $this->db_role ) &&
           ( !$service->restricted || $this->db_role->has_service( $service ) );
  }

  /**
   * Returns whether to use a database transaction.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @access public
   */
  public function use_transaction() { return $this->transaction; }

  /**
   * Set whether to use a database transaction.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param boolean $transaction
   * @access public
   */
  public function set_use_transaction( $use ) { $this->transaction = $use; }

  /**
   * Returns whether the session has been initialized or not.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @access public
   */
  public function is_initialized() { return 'initialized' == $this->state; }

  /**
   * Returns whether the session has been shutdown or not.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @access public
   */
  public function is_shutdown() { return 'shutdown' == $this->state; }

  /**
   * Which state the session is in (one of 'created', 'initialized' or 'shutdown')
   * @var string 
   * @access private
   */
  private $state = NULL;

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
  private $db_user = NULL;

  /**
   * The record of the current role.
   * @var database\role
   * @access private
   */
  private $db_role = NULL;

  /**
   * The record of the current site.
   * @var database\site
   * @access private
   */
  private $db_site = NULL;

  /**
   * The qualified access record for the current user/site/role
   * @var database\access
   * @access private
   */
   private $db_access = NULL;
  /**
   * The record of the current application.
   * @var database\application
   * @access private
   */
  private $db_application = NULL;

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
   * Whether a database transaction needs to be performed during this session.
   * @var boolean
   * @access private
   */
  private $transaction = false;
}
