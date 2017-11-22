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
class role extends record
{
  /**
   * Override parent method if identifier is 0 (get record from session)
   */
  public static function get_record_from_identifier( $identifier )
  {
    // session objects can be loaded by using the identifier 0
    return 0 === $identifier || '0' === $identifier ?
      lib::create( 'business\session' )->get_role() :
      parent::get_record_from_identifier( $identifier );
  }

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
      log::warning( 'Tried to determine whether role has operation for role with no primary key.' );
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
      log::warning( 'Tried to determine whether role has service for role with no primary key.' );
      return false;
    }

    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'service_id', '=', $db_service->id );
    return 0 < $this->get_service_count( $modifier );
  }

  /**
   * Returns whether the role has access to a hold_type
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\hold $db_hold
   * @return bool
   */
  public function has_hold_type( $db_hold_type )
  {
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to determine whether role has hold_type for role with no primary key.' );
      return false;
    }

    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'hold_type_id', '=', $db_hold_type->id );
    return 0 < $this->get_hold_type_count( $modifier );
  }
}
