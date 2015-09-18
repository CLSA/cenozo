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
   * Closes any record whose user has had no activity for at least one hour
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   * @static
   */
  public static function close_lapsed()
  {
    $session = lib::create( 'business\session' );
    $setting_manager = lib::create( 'business\setting_manager' );

    static::db()->execute( sprintf(
      'UPDATE activity'.
      "\n".'JOIN access USING( user_id, role_id, site_id )'.
      "\n".'SET end_datetime = datetime'.
      "\n".'WHERE end_datetime IS NULL'.
      "\n".'  AND datetime + INTERVAL %s < UTC_TIMESTAMP()',
      $setting_manager->get_setting( 'general', 'activity_timeout' ) ) );

    // close all open activity by this user NOT for the current site/role
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'end_datetime', '=', NULL );
    $modifier->where( 'user_id', '=', $session->get_user()->id );
    $modifier->where_bracket( true );
    $modifier->where( 'site_id', '!=', $session->get_site()->id );
    $modifier->or_where( 'role_id', '!=', $session->get_role()->id );
    $modifier->where_bracket( false );

    static::db()->execute( sprintf(
      'UPDATE activity SET end_datetime = UTC_TIMESTAMP() %s',
      $modifier->get_sql() ) );
  }
}
