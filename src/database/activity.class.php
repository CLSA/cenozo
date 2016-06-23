<?php
/**
 * activity.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
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
   * Closes any record whose user has had no activity for longer than the activity timeout
   * 
   * If a user is provided then this method will also close the user's activity (whether timed
   * out or not).  An access record may be provided which will be excluded from being closed.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\user $db_user Which user to close all activity
   * @param database\access $db_access Which access to keep open when closing all user activity
   * @access public
   * @static
   */
  public static function close_lapsed( $db_user = NULL, $db_access = NULL )
  {
    $db_application = lib::create( 'business\session' )->get_application();

    $modifier = static::get_expired_modifier();
    $modifier->where( 'activity.application_id', '=', $db_application->id );
    $modifier->where( 'end_datetime', '=', NULL );

    try
    {
      // close all lapsed activity
      static::db()->execute( sprintf(
        'UPDATE activity'.
        "\n".'JOIN access USING( user_id, role_id, site_id )'.
        "\n".'SET end_datetime = datetime %s',
        $modifier->get_sql() ) );

      if( !is_null( $db_user ) )
      {
        // close all open activity by this user NOT for the current site/role
        $modifier = lib::create( 'database\modifier' );
        $modifier->where( 'end_datetime', '=', NULL );
        $modifier->where( 'application_id', '=', $db_application->id );
        $modifier->where( 'user_id', '=', $db_user->id );

        if( !is_null( $db_access ) )
        {
          $modifier->where_bracket( true );
          $modifier->where( 'site_id', '!=', $db_access->site_id );
          $modifier->or_where( 'role_id', '!=', $db_access->role_id );
          $modifier->where_bracket( false );
        }

        static::db()->execute( sprintf(
          'UPDATE activity SET end_datetime = UTC_TIMESTAMP() %s',
          $modifier->get_sql() ) );
      }
    }
    // catch any deadlock notices and ignore them
    catch( \cenozo\exception\notice $e ) {}
  }

  // TODO: document
  public static function get_expired_modifier()
  {
    $setting_manager = lib::create( 'business\setting_manager' );

    $modifier = lib::create( 'database\modifier' );
    $modifier->where(
      sprintf( 'access.datetime + INTERVAL %s',
               $setting_manager->get_setting( 'general', 'activity_timeout' ) ),
      '<', 'UTC_TIMESTAMP()', false );
    return $modifier;
  }
}
