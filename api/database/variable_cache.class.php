<?php
/**
 * variable_cache.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * variable_cache: record
 */
class variable_cache extends record
{
  /**
   * Replaces an array of variable=>value pairs for a participant
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\participant $db_participant
   * @param array( variable=>value ) $values
   * @param datetime $expiry When the variables expire (default is NULL which means never)
   * @return int (the number of affected rows)
   * @static
   * @access public
   */
  public static function overwrite_values( $db_participant, $values, $expiry = NULL )
  {
    $array = array();
    foreach( $values as $variable => $value )
      $array[] = sprintf(
        '( %s, %s, %s, %s )',
        static::db()->format_string( $db_participant->id ),
        static::db()->format_string( $variable ),
        static::db()->format_string( $value ),
        static::db()->format_string( $expiry ) );

    $sql = 'REPLACE INTO variable_cache( participant_id, variable, value, expiry ) '.implode( ',', $array );
    return static::db()->execute( $sql );
  }
}
