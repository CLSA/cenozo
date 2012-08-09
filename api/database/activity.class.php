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
   * Get the datetime of the earliest/first activity.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param modifier $modifier Modification to the query.
   * @return \DateTime
   * @static
   * @access public
   */
  public static function get_min_datetime( $modifier = NULL )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $sql = sprintf( 'SELECT MIN( datetime ) FROM %s '.
                    'LEFT JOIN operation ON operation_id = operation.id %s',
                    static::get_table_name(),
                    is_null( $modifier ) ? '' : $modifier->get_sql() );
    $datetime = static::db()->get_one( $sql );
    
    return is_null( $datetime )
      ? NULL
      : $util_class_name::get_datetime_object(
          $util_class_name::from_server_datetime( $datetime ) );
  }

  /**
   * Get the datetime of the latest/last activity.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param modifier $modifier Modification to the query.
   * @return \DateTime
   * @static
   * @access public
   */
  public static function get_max_datetime( $modifier = NULL )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $sql = sprintf( 'SELECT MAX( datetime ) FROM %s '.
                    'LEFT JOIN operation ON operation_id = operation.id %s',
                    static::get_table_name(),
                    is_null( $modifier ) ? '' : $modifier->get_sql() );

    $datetime = static::db()->get_one( $sql );

    return is_null( $datetime )
      ? NULL
      : $util_class_name::get_datetime_object(
          $util_class_name::from_server_datetime( $datetime ) );
  }

  /**
   * Returns the number of hours that a user has spend at a given site and role on a
   * particular day.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param access $db_access The access to query.
   * @param string $date A date string in any valid PHP date time format.
   * @return float
   * @static
   * @access public
   */
  public static function get_elapsed_time( $db_user, $db_site, $db_role, $date )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $time = 0;
    $total_time = 0;
    $start_datetime_obj = NULL;
    $end_datetime_obj = NULL;

    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'user_id', '=', $db_user->id );
    $modifier->where( 'site_id', '=', $db_site->id );
    $modifier->where( 'operation.subject', '!=', 'self' );
    $modifier->where( 'datetime', '>=', $db_site->to_site_datetime( $date.' 0:00:00' ) );
    $modifier->where( 'datetime', '<=', $db_site->to_site_datetime( $date.' 23:59:59' ) );

    foreach( static::select( $modifier ) as $db_activity )
    {
      if( $db_activity->role_id == $db_role->id )
      {
        if( is_null( $start_datetime_obj ) )
        {
          $start_datetime_obj = $util_class_name::get_datetime_object( $db_activity->datetime );
          $time = 0;
        }
        else
        {
          $end_datetime_obj = $util_class_name::get_datetime_object( $db_activity->datetime );
          $interval_obj = $util_class_name::get_interval( $end_datetime_obj, $start_datetime_obj );
          $time = $interval_obj->h + $interval_obj->i / 60 + $interval_obj->s / 3600;
        }
      }
      else // the user changed role, stop counting time
      {
        $total_time += $time;
        $start_datetime_obj = NULL;
        $time = 0;
      }
    }

    $total_time += $time;

    return $total_time;
  }
}
?>
