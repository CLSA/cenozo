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
    if( $select->has_table_column( '', 'role_count' ) ||
        $select->has_table_column( '', 'user_count' ) ||
        $select->has_table_column( '', 'last_access_datetime' ) )
    {
      $user_join_access =
        'SELECT user_id, '.
               'COUNT( DISTINCT role_id ) AS role_count, '.
               'COUNT( DISTINCT site_id ) AS site_count, '.
               'MAX( datetime ) AS last_access_datetime '.
        'FROM access '.
        'GROUP BY user_id ';
      $modifier->left_join(
        sprintf( '( %s ) AS user_join_access', $user_join_access ),
        'user.id',
        'user_join_access.user_id' );

      // override columns so that we can fake these columns being in the user table
      if( $select->has_table_column( '', 'role_count' ) )
        $select->add_column( 'IFNULL( role_count, 0 )', 'role_count', false );
      if( $select->has_table_column( '', 'site_count' ) )
        $select->add_column( 'IFNULL( site_count, 0 )', 'site_count', false );
      if( $select->has_table_column( '', 'last_access_datetime' ) )
        $select->add_column( 'user_join_access.last_access_datetime', 'last_access_datetime', false );
    }
  }
}
