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
    // add the total number of related records
    if( $select->has_table_column( '', 'site_count' ) ||
        $select->has_table_column( '', 'user_count' ) ||
        $select->has_table_column( '', 'last_access_datetime' ) )
    {
      $role_join_access =
        'SELECT role_id, '.
               'COUNT( DISTINCT user_id ) AS user_count, '.
               'COUNT( DISTINCT site_id ) AS site_count, '.
               'MAX( datetime ) AS last_access_datetime '.
        'FROM access '.
        'GROUP BY role_id ';
      $modifier->left_join(
        sprintf( '( %s ) AS role_join_access', $role_join_access ),
        'role.id',
        'role_join_access.role_id' );

      // override columns so that we can fake these columns being in the role table
      if( $select->has_table_column( '', 'user_count' ) )
        $select->add_column( 'IFNULL( user_count, 0 )', 'user_count', false );
      if( $select->has_table_column( '', 'site_count' ) )
        $select->add_column( 'IFNULL( site_count, 0 )', 'site_count', false );
      if( $select->has_table_column( '', 'last_access_datetime' ) )
        $select->add_column( 'role_join_access.last_access_datetime', 'last_access_datetime', false );
    }
  }
}
