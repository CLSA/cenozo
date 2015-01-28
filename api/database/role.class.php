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
   * Extend parent method by restricting selection to records belonging to this application only
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the selection.
   * @param boolean $count If true the total number of records instead of a list
   * @param boolean $distinct Whether to use the DISTINCT sql keyword
   * @param enum $format Whether to return an object, column data or only the record id
   * @param boolean $full If true then records will not be restricted by application
   * @access public
   * @static
   */
  public static function select(
    $modifier = NULL, $count = false, $distinct = true, $format = 0, $full = false )
  {
    if( !$full )
    {
      // make sure to only include sites belonging to this application
      if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'application_has_role.application_id', '=',
                        lib::create( 'business\session' )->get_application()->id );
    }

    return parent::select( $modifier, $count, $distinct, $format );
  }

  /**
   * Override parent method by restricting returned records to those belonging to this application only
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string|array $column A column with the unique key property (or array of columns)
   * @param string|array $value The value of the column to match (or array of values)
   * @return database\record
   * @static
   * @access public
   */
  public static function get_unique_record( $column, $value, $full = false )
  {
    $db_role = parent::get_unique_record( $column, $value );

    // make sure to only include roles belonging to this application
    if( !$full )
    {
      $application_mod = lib::create( 'database\modifier' );
      $application_mod->where(
        'application_id', '=', lib::create( 'business\session' )->get_application()->id );
      if( !is_null( $db_role ) &&
          0 == $db_role->get_application_count( $application_mod ) ) $db_role = NULL;
    }

    return $db_role;
  }

  /**
   * Make sure to only include roles which this application has access to.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $record_type The type of record.
   * @param modifier $modifier A modifier to apply to the list or count.
   * @param boolean $inverted Whether to invert the count (count records NOT in the joining table).
   * @param boolean $count If true then this method returns the count instead of list of records.
   * @param boolean $distinct Whether to use the DISTINCT sql keyword
   * @param enum $format Whether to return an object, column data or only the record id
   * @return array( record ) | array( int ) | int
   * @access protected
   */
  public function get_record_list(
    $record_type,
    $modifier = NULL,
    $inverted = false,
    $count = false,
    $distinct = true,
    $format = 0 )
  {
    if( 'application' == $record_type )
    {
      if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'application_has_role.application_id', '=',
                        lib::create( 'business\session' )->get_application()->id );
    }
    return parent::get_record_list(
      $record_type, $modifier, $inverted, $count, $distinct, $format );
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
      log::warning( 'Tried to determine whether role has operation for role with no id.' );
      return false;
    }

    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'operation_id', '=', $db_operation->id );
    return 0 < $this->get_operation_count( $modifier );
  }

  /**
   * Returns whether the role has access to an operation
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
