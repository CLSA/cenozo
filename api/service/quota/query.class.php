<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\quota;
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
    // add the age_group range
    $select->add_column( 'CONCAT( age_group.lower, " to ", age_group.upper )', 'age_group_range', false );
    $modifier->join( 'age_group', 'quota.age_group_id', 'age_group.id' );
  }
}
