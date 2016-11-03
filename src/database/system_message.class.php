<?php
/**
 * system_message.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * system_message: record
 */
class system_message extends record
{
  /**
   * Deletes all expired system messages
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   * @static
   */
  public static function remove_expired()
  {
    static::db()->execute( 'DELETE FROM system_message WHERE expiry < DATE( UTC_TIMESTAMP() )' );
  }
}
