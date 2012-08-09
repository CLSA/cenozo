<?php
/**
 * operation.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * operation: record
 */
class operation extends record
{
  /**
   * Get an operation given it's type, subject and name.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $type "push", "pull" or "widget"
   * @param string $subject
   * @param string $name
   * @static
   * @access public
   */
  public static function get_operation( $type, $subject, $name )
  {
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'type', '=', $type );
    $modifier->where( 'subject', '=', $subject );
    $modifier->where( 'name', '=', $name );

    $id = static::db()->get_one(
      sprintf( 'SELECT id FROM %s %s',
               static::get_table_name(),
               $modifier->get_sql() ) );

    return is_null( $id ) ? NULL : new static( $id );
  }
}
?>
