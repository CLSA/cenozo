<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\user;
use cenozo\lib, cenozo\log;

/**
 * Extends the base class query class
 */
class query extends \cenozo\service\query
{
  /**
   * Applies changes to select and modifier objects for all queries which have this
   * subject as its leaf-collection
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\select $select The query's select object to modify
   * @param database\modifier $modifier The query's modifier object to modify
   * @access protected
   * @static
   */
  protected static function add_global_modifications( $select, $modifier )
  {
    // add the total number of roles
    if( $select->has_table_column( '', 'role_count' ) )
    {
      $user_join_role =
        'SELECT user_id, COUNT(*) AS role_count '.
        'FROM access '.
        'GROUP BY user_id';
      $modifier->left_join(
        sprintf( '( %s ) AS user_join_role', $user_join_role ),
        'user.id',
        'user_join_role.user_id' );
      $select->add_column( 'IFNULL( role_count, 0 )', 'role_count', false );
    }

    // add the total number of sites
    if( $select->has_table_column( '', 'site_count' ) )
    {
      $user_join_site =
        'SELECT user_id, COUNT(*) AS site_count '.
        'FROM access '.
        'GROUP BY user_id';
      $modifier->left_join(
        sprintf( '( %s ) AS user_join_site', $user_join_site ),
        'user.id',
        'user_join_site.user_id' );
      $select->add_column( 'IFNULL( site_count, 0 )', 'site_count', false );
    }

    // link to the user's last activity and add the activity's datetime
    $modifier->left_join( 'user_last_activity', 'user.id', 'user_last_activity.user_id' );
    $modifier->left_join( 'activity', 'user_last_activity.activity_id', 'last_activity.id', 'last_activity' );
    $select->add_table_column( 'last_activity', 'datetime', 'last_datetime' );
  }
}
