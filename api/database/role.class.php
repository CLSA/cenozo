<?php
/**
 * role.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * role: record
 */
class role extends base_access
{
  /**
   * Returns whether the role has access to an operation
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\operation $db_operation
   * @return bool
   */
  public function has_operation( $db_operation )
  {
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to determine whether role has operation for role with no id.' );
      return false;
    }

    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'operation_id', '=', $db_operation->id );
    return 0 < $this->get_operation_count( $modifier );
  }

  /**
   * Returns whether the role has access to a service
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\operation $db_operation
   * @return bool
   */
  public function has_service( $db_service )
  {
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to determine whether role has service for role with no id.' );
      return false;
    }

    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'service_id', '=', $db_service->id );
    return 0 < $this->get_service_count( $modifier );
  }

  /**
   * Returns whether the role has access to a state
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\state $db_state
   * @return bool
   */
  public function has_state( $db_state )
  {
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to determine whether role has state for role with no id.' );
      return false;
    }

    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'state_id', '=', $db_state->id );
    return 0 < $this->get_state_count( $modifier );
  }
}
