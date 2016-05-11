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
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\user $db_user If changing site/role then the user must be provided here
   * @param database\site $db_site If changing site/role then the site must be provided here
   * @param database\role $db_role If changing site/role then the role must be provided here
   * @access public
   * @static
   */
  public static function close_lapsed( $db_user = NULL, $db_site = NULL, $db_role = NULL )
  {
    $db_application = lib::create( 'business\session' )->get_application();

    $modifier = static::get_expired_modifier();
    $modifier->where( 'activity.application_id', '=', $db_application->id );
    $modifier->where( 'end_datetime', '=', NULL );

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
      if( !is_null( $db_site ) ) $modifier->where( 'site_id', '!=', $db_site->id );
      if( !is_null( $db_role ) ) $modifier->where( 'role_id', '!=', $db_role->id );

      static::db()->execute( sprintf(
        'UPDATE activity SET end_datetime = UTC_TIMESTAMP() %s',
        $modifier->get_sql() ) );
    }
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
