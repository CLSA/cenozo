<?php
/**
 * role.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\database
 * @filesource
 */

namespace cenozo\database;
use cenozo\log, cenozo\util;
use cenozo\business as bus;
use cenozo\exception as exc;

/**
 * role: record
 *
 * @package cenozo\database
 */
class role extends base_access
{
  /**
   * Returns whether the user has the role for the given site.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\operation $db_operation
   * @return bool
   */
  public function has_operation( $db_operation )
  {
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to determine operation for role with no id.' );
      return false;
    }

    $modifier = util::create( 'database\modifier' );
    $modifier->where( 'operation_id', '=', $db_operation->id );
    return 0 < $this->get_operation_count( $modifier );
  }
}
?>
