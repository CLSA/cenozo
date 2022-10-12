<?php
/**
 * notation.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * notation: record
 */
class notation extends record
{
  /**
   * Extend parent method
   */
  public static function get_unique_record( $column, $value )
  {
    // For application_type_id value, transform "null" string to NULL value
    // NOTE: a null application_type_id represents a notation belonging to the framework (not the application)
    if( is_array( $column ) &&
        false !== ($index = array_search( 'application_type_id', $column )) &&
        'null' === $value[$index] )
    {
      $value[$index] = NULL;
    }
    
    return parent::get_unique_record( $column, $value );
  }
}
