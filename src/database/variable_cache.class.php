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
   * Removes expired variable values
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @static
   * @access public
   */
  public static function remove_expired()
  {
    return static::db()->execute( 'DELETE FROM variable_cache WHERE expiry <= UTC_TIMESTAMP()' );
  }

  /**
   * Replaces an array of variable=>value pairs for a participant
   * 
   * All values are always set to expiry in 1 day
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\participant $db_participant
   * @param array( variable=>value ) $values
   * @return int (the number of affected rows)
   * @static
   * @access public
   */
  public static function overwrite_values( $db_participant, $values )
  {
    $array = array();
    foreach( $values as $variable => $value )
      $array[] = sprintf(
        '( %s, %s, %s, UTC_TIMESTAMP() + INTERVAL 1 DAY )',
        static::db()->format_string( $db_participant->id ),
        static::db()->format_string( $variable ),
        static::db()->format_string( $value ) );

    $sql = 'REPLACE INTO variable_cache( participant_id, variable, value, expiry ) '.
           'VALUES '.implode( ',', $array );
    return static::db()->execute( $sql );
  }
}
