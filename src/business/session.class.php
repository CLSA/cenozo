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
    $activity_class_name = lib::get_class_name( 'database\activity' );
    $util_class_name = lib::get_class_name( 'util' );

    $setting_manager = lib::create( 'business\setting_manager' );

    $this->database = lib::create( 'database\database',
      $setting_manager->get_setting( 'db', 'server' ),
      $setting_manager->get_setting( 'db', 'username' ),
      $setting_manager->get_setting( 'db', 'password' ),
      sprintf( '%s%s', $setting_manager->get_setting( 'db', 'database_prefix' ), INSTANCE ) );

    // define the session's application
    $this->db_application = $application_class_name::get_unique_record( 'name', INSTANCE );
    if( is_null( $this->db_application ) )
      throw lib::create( 'exception\runtime',
        'Failed to find application record in database, please check general/instance_name '.
        'setting in application\'s settings.local.ini.php file',
        __METHOD__ );

    // check for a basic authorization header
    $request_headers = apache_request_headers();
    if( false === $request_headers )
      throw lib::create( 'exception\runtime', 'Unable to decode request headers', __METHOD__ );

    $this->login();
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

    // shut down the voip manager (this only has an effect if voip is enabled)
    lib::create( 'business\voip_manager' )->shutdown();

    session_write_close();

    $this->state = 'shutdown';
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
   * Get the survey database.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return database
   * @access public
   */
  public function get_survey_database()
  {
    // create the database if it doesn't exist yet
    if( is_null( $this->survey_database ) )
    {
      $setting_manager = lib::create( 'business\setting_manager' );
      $this->survey_database = lib::create( 'database\database',
        $setting_manager->get_setting( 'survey_db', 'server' ),
        $setting_manager->get_setting( 'survey_db', 'username' ),
        $setting_manager->get_setting( 'survey_db', 'password' ),
        $setting_manager->get_setting( 'survey_db', 'database' ) );
    }

    return $this->survey_database;
  }

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
   * Get the current site's setting.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return database\setting
   * @access public
   */
  public function get_setting() { return $this->db_setting; }

  /**
   * Returns a list of all active sessions belonging to the current user
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return array
   * @access public
   */
  public function get_session_list()
  {
    $session_list = array();

    if( !is_null( $this->db_user ) )
    {
      $access_class_name = lib::get_class_name( 'database\access' );

      $address_list = array();
      $path = session_save_path();
      foreach( scandir( $path ) as $file )
      {
        if( 'sess_' == substr( $file, 0, 5 ) )
        {
          $contents = file_get_contents( sprintf( '%s/%s', $path, $file ) );

          $matches = array();
          preg_match( '/access\.id\|i:([0-9]+);/', $contents, $matches );
          if( array_key_exists( 1, $matches ) )
          {
            $access_id = $matches[1];
            if( !array_key_exists( $access_id, $address_list ) ) $address_list[$access_id] = array();
            $address = 'unknown';
            $matches = array();
            preg_match( '/address\|s:[0-9]+:"([^"]+)";/', $contents, $matches );
            if( array_key_exists( 1, $matches ) ) $address = $matches[1];
            $address_list[$access_id][] = $address;
          }
        }
      }

      // get all access records
      $access_sel = lib::create( 'database\select' );
      $access_sel->add_column( 'id' );
      $access_sel->add_table_column( 'site', 'name', 'site' );
      $access_sel->add_table_column( 'role', 'name', 'role' );
      $access_sel->add_column( 'datetime' );
      $access_mod = lib::create( 'database\modifier' );
      $access_mod->where( 'access.id', 'in', array_keys( $address_list ) );
      $access_mod->where( 'access.user_id', '=', $this->db_user->id );
      $access_mod->join( 'site', 'access.site_id', 'site.id' );
      $access_mod->join( 'role', 'access.role_id', 'role.id' );
      $access_mod->order_desc( 'datetime' );
      foreach( $access_class_name::select( $access_sel, $access_mod ) as $access )
      {
        foreach( $address_list[$access['id']] as $address )
        {
          $session_list[] = array(
            'address' => $address,
            'site' => $access['site'],
            'role' => $access['role'],
            'datetime' => $access['datetime']
          );
        }
      }
    }

    return $session_list;
  }

  /**
   * Log a user into the application
   * 
   * Will return whether the user has access to the site/role pair
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $username Should only be provided when processing the login box/service
   * @param database\site $db_site Should only be provided when changing the current site
   * @param database\role $db_role Should only be provided when changing the current role
   * @access public
   */
  public function login( $username = NULL, $db_site = NULL, $db_role = NULL )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $access_class_name = lib::get_class_name( 'database\access' );
    $activity_class_name = lib::get_class_name( 'database\activity' );
    $user_class_name = lib::get_class_name( 'database\user' );
    $site_class_name = lib::get_class_name( 'database\site' );
    $role_class_name = lib::get_class_name( 'database\role' );

    $success = false;

    // only perform if not shut down and user record is set
    if( !$this->is_shutdown() )
    {
      if( !is_null( $username ) && !is_string( $username ) )
        throw lib::create( 'exception\argument', 'username', $username, __METHOD__ );
      if( !is_null( $db_site ) && !is_a( $db_site, $site_class_name ) )
        throw lib::create( 'exception\argument', 'db_site', $db_site, __METHOD__ );
      if( !is_null( $db_role ) && !is_a( $db_role, $role_class_name ) )
        throw lib::create( 'exception\argument', 'db_role', $db_role, __METHOD__ );

      // try loading the access record
      $db_access = NULL;
      if( array_key_exists( 'access.id', $_SESSION ) )
      {
        try { $db_access = lib::create( 'database\access', $_SESSION['access.id'] ); }
        catch( \cenozo\exception\runtime $e ) { $db_access = NULL; }
      }

      // if the session has an access.id but the remote address doesn't match the session's address or the
      // access doesn't exist then immediately logout
      if( array_key_exists( 'access.id', $_SESSION ) &&
          ( is_null( $db_access ) || $_SESSION['address'] != $_SERVER['REMOTE_ADDR'] ) )
      {
        $this->logout();
      }
      else
      {
        if( !is_null( $db_access ) ) $this->db_user = $db_access->get_user();

        // resolve the user and access
        if( !is_null( $username ) )
        {
          if( is_null( $this->db_user ) )
          {
            $this->db_user = $user_class_name::get_unique_record( 'name', $username );
          }
          else
          {
            if( $username != $this->db_user->name )
              throw lib::create( 'exception\runtime',
                'Tried to login with different user while already logged in.',
                __METHOD__ );
          }
        }

        if( !is_null( $this->db_user ) && $this->db_user->active )
        {
          if( !is_null( $db_site ) && !is_null( $db_role ) )
          {
            $db_access = $access_class_name::get_unique_record(
              array( 'user_id', 'role_id', 'site_id' ),
              array( $this->db_user->id, $db_role->id, $db_site->id ) );
          }
          else if( is_null( $db_access ) )
          {
            // find the most recent access restricted to the given site/role (if any)
            $access_mod = lib::create( 'database\modifier' );
            $access_mod->join( 'application_has_site', 'access.site_id', 'application_has_site.site_id' );
            $access_mod->where( 'application_has_site.application_id', '=', $this->db_application->id );
            $access_mod->order_desc( 'datetime' );
            $access_mod->order_desc( 'microtime' );
            $access_mod->limit( 1 );
            if( !is_null( $db_site ) ) $access_mod->where( 'access.site_id', '=', $db_site->id );
            if( !is_null( $db_role ) ) $access_mod->where( 'access.role_id', '=', $db_role->id );
            $access_list = $this->db_user->get_access_object_list( $access_mod );
            if( 0 < count( $access_list ) ) $db_access = current( $access_list );
          }

          if( !is_null( $db_access ) )
          {
            $this->db_access = $db_access;
            $this->db_site = $this->db_access->get_site();
            $this->db_setting = current( $this->db_site->get_setting_object_list() );
            $this->db_role = $this->db_access->get_role();
            $_SESSION['access.id'] = $db_access->id;
            $_SESSION['address'] = $_SERVER['REMOTE_ADDR'];

            $activity_class_name::close_lapsed( $this->db_user, $this->db_site, $this->db_role );

            // create a new activity if there isn't already one open
            $activity_mod = lib::create( 'database\modifier' );
            $activity_mod->where( 'user_id', '=', $this->db_user->id );
            $activity_mod->where( 'application_id', '=', $this->db_application->id );
            $activity_mod->where( 'site_id', '=', $this->db_site->id );
            $activity_mod->where( 'role_id', '=', $this->db_role->id );
            $activity_mod->where( 'end_datetime', '=', NULL );
            if( 0 == $this->db_user->get_activity_count( $activity_mod ) )
            {
              $db_activity = lib::create( 'database\activity' );
              $db_activity->user_id = $this->db_user->id;
              $db_activity->application_id = $this->db_application->id;
              $db_activity->site_id = $this->db_site->id;
              $db_activity->role_id = $this->db_role->id;
              $db_activity->start_datetime = $util_class_name::get_datetime_object();
              $db_activity->save();
            }

            // update the access with the current time
            $this->mark_access_time();

            $success = true;
          }
        }
      }
    }

    return $success;
  }

  /**
   * Logs a user out of the application
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $username
   * @access public
   */
  public function logout()
  {
    $activity_class_name = lib::get_class_name( 'database\activity' );
    $activity_class_name::close_lapsed( $this->db_user );
    $this->db_access = NULL;
    $this->db_user = NULL;
    $this->db_site = NULL;
    $this->db_setting = NULL;
    $this->db_role = NULL;
    session_destroy();
  }

  /**
   * Store in the session whether the user must change their password (given an input password)
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $password
   * @access public
   */
  public function set_no_password( $password )
  {
    $setting_manager = lib::create( 'business\setting_manager' );
    if( !is_null( $this->db_user ) )
      $_SESSION['no_password'] = $setting_manager->get_setting( 'general', 'default_password' ) == $password;
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
   * @param database\service $db_service If null this method returns false.
   * @return boolean
   * @access public
   */
  public function is_service_allowed( $db_service )
  {
    $allowed = false;

    if( !is_null( $db_service ) )
    {
      // if not logged in then only allow the login service
      $allowed = is_null( $this->db_role )
               ? 'POST' == $db_service->method && 'self' == $db_service->subject
               : !$db_service->restricted || $this->db_role->has_service( $db_service );
    }

    return $allowed;
  }

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
   * @var database\database
   * @access private
   */
  private $database = NULL;

  /**
   * Limesurvey's database object.
   * @var database\database
   * @access private
   */
  private $survey_database = NULL;

  /**
   * Data generated by the service (if any).
   * @var mixed
   * @access protected
   */
  protected $data = NULL;

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
   * The record of the current setting.
   * @var database\setting
   * @access private
   */
  private $db_setting = NULL;

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
}