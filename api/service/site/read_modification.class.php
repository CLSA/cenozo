<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\site;
use cenozo\lib, cenozo\log;

/**
 * Extends the base class query class
 */
class read_modification extends \cenozo\base_object
{
  /**
   * Applies changes to select and modifier objects for all queries which have this
   * subject as its leaf-collection
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\select $select The query's select object to modify
   * @param database\modifier $modifier The query's modifier object to modify
   * @access public
   * @static
   */
  public static function apply( $select, $modifier )
  {
    // add the total number of roles
    if( $select->has_table_column( '', 'role_count' ) )
    {
      $site_join_role =
        'SELECT site_id, COUNT(*) AS role_count '.
        'FROM access '.
        'GROUP BY site_id';
      $modifier->left_join(
        sprintf( '( %s ) AS site_join_role', $site_join_role ),
        'site.id',
        'site_join_role.site_id' );
      $select->add_column( 'IFNULL( role_count, 0 )', 'role_count', false );
    }

    // add the total number of users
    if( $select->has_table_column( '', 'user_count' ) )
    {
      $site_join_user =
        'SELECT site_id, COUNT(*) AS user_count '.
        'FROM access '.
        'GROUP BY site_id';
      $modifier->left_join(
        sprintf( '( %s ) AS site_join_user', $site_join_user ),
        'site.id',
        'site_join_user.site_id' );
      $select->add_column( 'IFNULL( user_count, 0 )', 'user_count', false );
    }

    // link to the site's last activity and add the activity's datetime
    $modifier->left_join( 'site_last_activity', 'site.id', 'site_last_activity.site_id' );
    $modifier->left_join( 'activity', 'site_last_activity.activity_id', 'last_activity.id', 'last_activity' );
    $select->add_table_column( 'last_activity', 'datetime', 'last_datetime' );
  }
}
