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
    // add the total number of related records
    if( $select->has_table_column( '', 'role_count' ) ||
        $select->has_table_column( '', 'user_count' ) ||
        $select->has_table_column( '', 'last_access_datetime' ) )
    {
      $site_join_access =
        'SELECT site_id, '.
               'COUNT( DISTINCT role_id ) AS role_count, '.
               'COUNT( DISTINCT user_id ) AS user_count, '.
               'MAX( datetime ) AS last_access_datetime '.
        'FROM access '.
        'GROUP BY site_id ';
      $modifier->left_join(
        sprintf( '( %s ) AS site_join_access', $site_join_access ),
        'site.id',
        'site_join_access.site_id' );

      // override columns so that we can fake these columns being in the site table
      if( $select->has_table_column( '', 'role_count' ) )
        $select->add_column( 'IFNULL( role_count, 0 )', 'role_count', false );
      if( $select->has_table_column( '', 'user_count' ) )
        $select->add_column( 'IFNULL( user_count, 0 )', 'user_count', false );
      if( $select->has_table_column( '', 'last_access_datetime' ) )
        $select->add_column( 'site_join_access.last_access_datetime', 'last_access_datetime', false );
    }
  }
}
