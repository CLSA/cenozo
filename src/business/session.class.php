<?php
/**
 * session.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @throws exception\permission
   * @access public
   */
  public function initialize( $no_activity = false )
  {
    // only initialize once and after construction only
    if( 'created' != $this->state ) return;

    $application_class_name = lib::get_class_name( 'database\application' );
    $system_message_class_name = lib::get_class_name( 'database\system_message' );

    $setting_manager = lib::create( 'business\setting_manager' );

    $this->no_activity = $no_activity;

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

    // check that the server and app urls match
    $app_url = $this->db_application->url;
    $server_name = $_SERVER['SERVER_NAME'];
    if( 'localhost' != $server_name &&
        false === strpos( str_replace( '-', '_', $app_url ), str_replace( '-', '_', $server_name ) ) )
      throw lib::create( 'exception\runtime',
        sprintf( 'Server name, "%s", is not found in the application URL, "%s". '.
                 'Check the application URL name in the database and make sure they are correct.',
                 $server_name,
                 $app_url ),
        __METHOD__ );

    define( 'APP_TITLE', $this->db_application->title );

    // update the theme if we need to
    if( $this->db_application->theme_expired )
    {
      $theme_manager = lib::create( 'business\theme_manager' );
      if( $theme_manager->generate_theme_css() )
      {
        $this->db_application->theme_expired = false;
        $this->db_application->save();
      }
    }

    $this->read_jwt_cookie();
    if( $this->login() )
    {
      // remove any expired system messages
      if( !$this->no_activity ) $system_message_class_name::remove_expired();
    }
    $this->state = 'initialized';
  }

  /**
   * Ends the session.
   * 
   * This method should be called after the operation is performed
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
   * @return database
   * @access public
   */
  public function get_survey_database()
  {
    $setting_manager = lib::create( 'business\setting_manager' );
    if( !$setting_manager->get_setting( 'module', 'script' ) )
    {
      throw lib::create( 'exception\runtime',
        'Tried to get the limesurvey database but the script module is not enabled.',
        __METHOD__ );
    }

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
   * @return database\application
   * @access public
   */
  public function get_application() { return $this->db_application; }

  /**
   * Get the current role.
   * 
   * @return database\role
   * @access public
   */
  public function get_role() { return $this->db_role; }

  /**
   * Get the current user.
   * 
   * @return database\user
   * @access public
   */
  public function get_user() { return $this->db_user; }

  /**
   * Get the current site.
   * 
   * @return database\site
   * @access public
   */
  public function get_site() { return $this->db_site; }

  /**
   * Get the current site's setting.
   * 
   * @return database\setting
   * @access public
   */
  public function get_setting() { return $this->db_setting; }

  /**
   * Gets the pine application object (if one exists)
   */
  public function get_pine_application()
  {
    $application_class_name = lib::get_class_name( 'database\application' );
    $application_mod = lib::create( 'database\modifier' );
    $application_mod->join( 'application_type', 'application.application_type_id', 'application_type.id' );
    $application_mod->where( 'application_type.name', '=', 'pine' );
    $application_mod->limit( 1 );
    $application_list = $application_class_name::select_objects( $application_mod );
    return 0 < count( $application_list ) ? current( $application_list ) : NULL;
  }

  /**
   * Gets a cookie, or returns NULL if no cookie exists
   * @param string $name
   * @return string
   * @access public
   */
  public function get_cookie( $name )
  {
    return array_key_exists( $name, $_COOKIE ) ? $_COOKIE[$name] : NULL;
  }

  /**
   * Sets a cookie's value, creating it if it doesn't already exist
   * @param string $name
   * @param string $value
   * @access public
   */
  public function set_cookie( $name, $value )
  {
    // string $name,
    // string $value = "",
    // int $expires_or_options = 0,
    // string $path = "",
    // string $domain = "",
    // bool $secure = false,
    // bool $httponly = false
    $path = preg_replace( '/(api\/?)index.php/', '', $_SERVER['PHP_SELF'] );
    setcookie(
      $name,
      $value,
      0,
      sprintf( '%s;SameSite=Lax', $path ),
      $_SERVER['SERVER_NAME'],
      true,
      true
    );
  }

  /**
   * Removes a cookie by immediately expiring it
   * @param string $name
   * @access public
   */
  public function remove_cookie( $name )
  {
    $path = preg_replace( '/(api\/?)index.php/', '', $_SERVER['PHP_SELF'] );
    setcookie(
      $name,
      '',
      time()-60,
      sprintf( '%s;SameSite=Lax', $path ),
      $_SERVER['SERVER_NAME'],
      true,
      true
    );
  }

  /**
   * Log a user into the application
   * 
   * If a username is provided then it is assumed that authentication has already passed and we already know who
   * the user is.  If no username is provided then a valid JWT cookie must exist and have a valid access ID.
   * 
   * @param string $username Should only be used when no JWT exists but the user has been authenticated
   * @param database\site $db_site Should only be provided when changing the current site
   * @param database\role $db_role Should only be provided when changing the current role
   * @access public
   */
  public function login( $username = NULL, $db_site = NULL, $db_role = NULL )
  {
    if( $this->is_shutdown() ) return false;

    $util_class_name = lib::get_class_name( 'util' );
    $access_class_name = lib::get_class_name( 'database\access' );
    $activity_class_name = lib::get_class_name( 'database\activity' );
    $user_class_name = lib::get_class_name( 'database\user' );
    $site_class_name = lib::get_class_name( 'database\site' );
    $role_class_name = lib::get_class_name( 'database\role' );

    $setting_manager = lib::create( 'business\setting_manager' );

    if( !is_null( $username ) && !is_string( $username ) )
      throw lib::create( 'exception\argument', 'username', $username, __METHOD__ );
    if( !is_null( $db_site ) && !is_a( $db_site, $site_class_name ) )
      throw lib::create( 'exception\argument', 'db_site', $db_site, __METHOD__ );
    if( !is_null( $db_role ) && !is_a( $db_role, $role_class_name ) )
      throw lib::create( 'exception\argument', 'db_role', $db_role, __METHOD__ );

    if( is_null( $username ) )
    {
      // immediately fail if there is no JWT
      if( is_null( $this->jwt ) ) return false;

      // make sure the JWT has an access ID and valid address
      $access_id = $this->jwt->get_data( 'access_id' );
      $address = $this->jwt->get_data( 'address' );
      if( !$access_id || $_SERVER['REMOTE_ADDR'] != $this->jwt->get_data( 'address' ) )
      {
        $this->logout();
        return false;
      }

      // make sure the access record exists
      $this->db_access = lib::create( 'database\access', $access_id );
      if( is_null( $this->db_access ) )
      {
        $this->logout();
        return false;
      }

      // make sure the user is activated
      $this->db_user = $this->db_access->get_user();
      if( !$this->db_user->active )
      {
        $utility = $setting_manager->get_setting( 'utility', 'username' );
        if( $utility == $this->db_user->name )
        {
          // show a warning in the log if the utility account has been disabled
          log::warning( sprintf(
            'The utility account, "%s", is not active. '.
            'Until it has been reactivated the application\'s reports, '.
            'cron jobs, and other utility functions will not work correctly.',
            $utility
          ) );
        }

        $this->logout();
        return false;
      }

      // if the site and role is provided then change to that access record if it exists
      if( !is_null( $db_site ) && !is_null( $db_role ) )
      {
        $db_access = $access_class_name::get_unique_record(
          array( 'user_id', 'role_id', 'site_id' ),
          array( $this->db_user->id, $db_role->id, $db_site->id )
        );

        // update the JWT if the access ID has changed
        if( !is_null( $db_access ) && $this->jwt->get_data( 'access_id' ) != $db_access->id )
        {
          $this->db_access = $db_access;
          $this->jwt->set_data( 'access_id', $this->db_access->id );
          $this->set_cookie( 'JWT', $this->jwt->get_encoded_value() );
        }
      }
    }
    else
    {
      $db_user = $user_class_name::get_unique_record( 'name', $username );

      // immeidately fail if the user doesn't exist or is inactive
      if( is_null( $db_user ) || !$db_user->active ) return false;
      $this->db_user = $db_user;

      // find the most recent access record (restricting to the provided site/role if set)
      $access_mod = lib::create( 'database\modifier' );
      $access_mod->order_desc( 'datetime' );
      $access_mod->order_desc( 'microtime' );
      $access_mod->limit( 1 );
      if( !is_null( $db_site ) ) $access_mod->where( 'access.site_id', '=', $db_site->id );
      if( !is_null( $db_role ) ) $access_mod->where( 'access.role_id', '=', $db_role->id );
      $access_list = $this->db_user->get_access_object_list( $access_mod );
      if( 0 == count( $access_list ) ) return false;
      $this->db_access = current( $access_list );

      // generate a new JWT
      $this->jwt = lib::create( 'business\jwt' );
      $this->jwt->set_data( 'access_id', $this->db_access->id );
      $this->jwt->set_data( 'address', $_SERVER['REMOTE_ADDR'] );
      $this->jwt->set_data( 'no_password', false );
      $this->set_cookie( 'JWT', $this->jwt->get_encoded_value() );
    }

    $this->db_site = $this->db_access->get_site();
    $this->db_role = $this->db_access->get_role();
    $this->db_setting = current( $this->db_site->get_setting_object_list() );

    // update the access with the current time
    $this->mark_access_time();

    return true;
  }

  /**
   * Logs a user out of the application
   * 
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
    $this->jwt = NULL;
    $this->remove_cookie( 'JWT' );
  }

  /**
   * Check request headers for authorization
   * TODO: return an array with the user/pass isntead of using referenced arguments
   * 
   * @param string &$username Will be set to the auth header's username, if successful
   * @param string &$password Will be set tot he auth header's password, if successful
   * @return boolean
   * @access public
   */
  public function check_authorization_header( &$username, &$password )
  {
    $util_class_name = lib::get_class_name( 'util' );

    $success = false;

    // check for a basic authorization header
    $headers = apache_request_headers();
    if( false === $headers )
      throw lib::create( 'exception\runtime', 'Unable to decode request headers', __METHOD__ );

    if( array_key_exists( 'Authorization', $headers ) )
    {
      $parts = explode( ' ', $headers['Authorization'] );
      if( 'Basic' == $parts[0] )
      {
        $auth = explode( ':', base64_decode( $parts[1] ), 2 );
        if( 2 == count( $auth ) )
        {
          if( $util_class_name::validate_user( $auth[0], $auth[1], true ) )
          {
            $username = $auth[0];
            $password = $auth[1];
            $success = true;
          }
        }
      }
    }

    return $success;
  }

  /** 
   * Determines whether the user must immediately change their password
   * @access public
   */
  public function get_no_password()
  {
    return !is_null( $this->jwt ) && $this->jwt->get_data( 'no_password' );
  }

  /**
   * Store in the session whether the user must change their password (given an input password)
   * 
   * @param string $password
   * @access public
   */
  public function set_no_password( $password )
  {
    $setting_manager = lib::create( 'business\setting_manager' );

    if( is_null( $this->jwt ) )
      throw lib::create( 'exception\runtime', 'Tried to set data in JWT but it doesn\'t exist.', __METHOD__ );

    $this->jwt->set_data(
      'no_password',
      !is_null( $this->db_user ) && $setting_manager->get_setting( 'general', 'default_password' ) == $password
    );
    $this->set_cookie( 'JWT', $this->jwt->get_encoded_value() );
  }

  /**
   * Return whether the session has permission to perform the given service.
   * 
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
   * Returns whether the session is in the created state or not.
   * 
   * @return boolean
   * @access public
   */
  public function is_created() { return 'created' == $this->state; }

  /**
   * Returns whether the session is in the initialized state or not.
   * 
   * @return boolean
   * @access public
   */
  public function is_initialized() { return 'initialized' == $this->state; }

  /**
   * Returns whether the session is in the shutdown state or not.
   * 
   * @return boolean
   * @access public
   */
  public function is_shutdown() { return 'shutdown' == $this->state; }

  /**
   * TODO: document
   */
  protected function read_jwt_cookie()
  {
    // see if there is a JWT cookie
    $this->jwt = NULL;
    $jwt_string = $this->get_cookie( 'JWT' );
    if( !is_null( $jwt_string ) )
    {
      // try loading the access record from the JWT
      $jwt = lib::create( 'business\jwt' );
      if( $jwt->decode( $jwt_string ) && $jwt->is_valid() )
      {
        // the cookie is a valid JWT, so store it to the session
        $this->jwt = $jwt;
      }
      else
      {
        // the cookie isn't valid, so remove it
        $this->remove_cookie( 'JWT' );
      }
    }
  }

  /**
   * Updates the access record with the current time
   * 
   * @access public
   */
  protected function mark_access_time()
  {
    if( !$this->no_activity )
    {
      $util_class_name = lib::get_class_name( 'util' );
      $activity_class_name = lib::get_class_name( 'database\activity' );

      $activity_class_name::update_activity();

      if( !is_null( $this->db_access ) )
      {
        $microtime = microtime();
        $this->db_access->datetime = $util_class_name::get_datetime_object();
        $this->db_access->microtime = substr( $microtime, 0, strpos( $microtime, ' ' ) );
        $this->db_access->save();
      }
    }
  }

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

  /**
   * The Javascript Web Token responsible for authentiation
   * @var business\jwt
   * @access private
   */
  protected $jwt = NULL;

  /**
   * Whether the user must immediately reset their password
   * @var boolean
   * @access private
   */
  private $no_password = false;

  /**
   * Whether or not to mark user access time
   * @var boolean
   * @access private
   */
  protected $no_activity = false;
}
