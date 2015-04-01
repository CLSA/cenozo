<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\role;
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
    // add the total number of sites
    if( $select->has_table_column( '', 'site_count' ) )
    {
      $role_join_site =
        'SELECT role_id, COUNT(*) AS site_count '.
        'FROM access '.
        'GROUP BY role_id';
      $modifier->left_join(
        sprintf( '( %s ) AS role_join_site', $role_join_site ),
        'role.id',
        'role_join_site.role_id' );
      $select->add_column( 'IFNULL( site_count, 0 )', 'site_count', false );
    }

    // add the total number of users
    if( $select->has_table_column( '', 'user_count' ) )
    {
      $role_join_user =
        'SELECT role_id, COUNT(*) AS user_count '.
        'FROM access '.
        'GROUP BY role_id';
      $modifier->left_join(
        sprintf( '( %s ) AS role_join_user', $role_join_user ),
        'role.id',
        'role_join_user.role_id' );
      $select->add_column( 'IFNULL( user_count, 0 )', 'user_count', false );
    }

    // link to the role's last activity and add the activity's datetime
    $modifier->left_join( 'role_last_activity', 'role.id', 'role_last_activity.role_id' );
    $modifier->left_join( 'activity', 'role_last_activity.activity_id', 'last_activity.id', 'last_activity' );
    $select->add_table_column( 'last_activity', 'datetime', 'last_datetime' );
  }
}
