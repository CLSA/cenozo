<?php
/**
 * activity.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * activity: record
 */
class activity extends record
{
  /**
   * Extends parent constructor
   */
  public function __construct( $id = NULL )
  {
    parent::__construct( $id );
    $this->write_timestamps = false;
  }

  /**
   * Update's the current user's activity based on the current session.
   * 
   * If there are any activity records for the current application and user which do not match
   * the current site and role they will be closed.  Also, a new activity record will be opened
   * if there are no open activity records for the current application, user, site and role.
   * @access public
   * @static
   */
  public static function update_activity()
  {
    $util_class_name = lib::get_class_name( 'util' );

    $setting_manager = lib::create( 'business\setting_manager' );
    $session = lib::create( 'business\session' );
    $db_application = $session->get_application();
    $db_user = $session->get_user();
    $db_site = $session->get_site();
    $db_role = $session->get_role();

    // ignore if this is the utility account
    if( $setting_manager->get_setting( 'utility', 'username' ) != $db_user->name )
    {
      // close all open activity that doesn't match the session's current application/user/site/role
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'application_id', '=', $db_application->id );
      $modifier->where( 'user_id', '=', $db_user->id );
      $modifier->where( 'end_datetime', '=', NULL );
      $modifier->where_bracket( true );
      $modifier->where( 'site_id', '!=', $db_site->id );
      $modifier->or_where( 'role_id', '!=', $db_role->id );
      $modifier->where_bracket( false );

      try
      {
        // the following often causes deadlocks but the are safe to ignore (caught and ignored below)
        static::db()->execute( sprintf(
          'UPDATE activity SET end_datetime = UTC_TIMESTAMP() %s',
          $modifier->get_sql() ), true, true );

        // create a new activity if there isn't already one open
        $modifier = lib::create( 'database\modifier' );
        $modifier->where( 'application_id', '=', $db_application->id );
        $modifier->where( 'site_id', '=', $db_site->id );
        $modifier->where( 'role_id', '=', $db_role->id );
        $modifier->where( 'end_datetime', '=', NULL );
        if( 0 == $db_user->get_activity_count( $modifier ) )
        {
          $db_activity = new static();
          $db_activity->application_id = $db_application->id;
          $db_activity->user_id = $db_user->id;
          $db_activity->site_id = $db_site->id;
          $db_activity->role_id = $db_role->id;
          $db_activity->start_datetime = $util_class_name::get_datetime_object();
          $db_activity->save();
        }
      }
      catch( \cenozo\exception\notice $e ) {} // ignore notices
    }
  }

  /**
   * Closes any record whose user has had no activity for longer than the activity timeout
   * 
   * If a user is provided then this method will only close the user's activity (whether timed
   * out or not).
   * @param database\user $db_user Which user to close all activity
   * @return Returns the number of rows closed
   * @access public
   * @static
   */
  public static function close_lapsed( $db_user = NULL )
  {
    $setting_manager = lib::create( 'business\setting_manager' );
    $db_application = lib::create( 'business\session' )->get_application();

    $affected_rows = 0;
    if( is_null( $db_user ) )
    {
      // close all lapsed activity
      $modifier = static::get_expired_modifier();
      $modifier->where( 'activity.application_id', '=', $db_application->id );
      $modifier->where( 'end_datetime', '=', NULL );

      $affected_rows = static::db()->execute( sprintf(
        'UPDATE activity'.
        "\n".'JOIN access USING( user_id, role_id, site_id )'.
        "\n".'SET end_datetime = datetime %s',
        $modifier->get_sql() ) );
    }
    else if( $setting_manager->get_setting( 'utility', 'username' ) != $db_user->name )
    {
      // close all open activity by this user
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'end_datetime', '=', NULL );
      $modifier->where( 'application_id', '=', $db_application->id );
      $modifier->where( 'user_id', '=', $db_user->id );

      $affected_rows = static::db()->execute(
        sprintf( 'UPDATE activity SET end_datetime = UTC_TIMESTAMP() %s', $modifier->get_sql() ),
        true,
        true // ignore deadlocks
      );
    }

    return $affected_rows;
  }

  /**
   * Returns a modifier which restricts to expired activity
   * 
   * @return database\modifier
   * @access public
   * @static
   */
  public static function get_expired_modifier()
  {
    $setting_manager = lib::create( 'business\setting_manager' );

    $modifier = lib::create( 'database\modifier' );
    $modifier->where(
      sprintf( 'access.datetime + INTERVAL %d MINUTE',
               $setting_manager->get_setting( 'general', 'activity_timeout' ) ),
      '<', 'UTC_TIMESTAMP()', false );
    return $modifier;
  }
}
