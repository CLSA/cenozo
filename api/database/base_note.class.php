<?php
/**
 * note.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * A base class for all note records.
 */
abstract class base_note extends record
{
  /**
   * Override parent method to remove datetime column from unique key.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return array( string )
   * @static
   * @access public
   */
  public static function get_unique_key_columns()
  {
    $column_list = array();
    $column_list = static::db()->get_column_names( static::get_table_name() );
    $column_list = array_diff( $column_list, array( 'id', 'datetime' ) );
    return $column_list;
  }
}
?>
