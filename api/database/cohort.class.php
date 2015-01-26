<?php
/**
 * cohort.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * cohort: record
 */
class cohort extends record
{
  /**
   * Extend parent method by restricting selection to records belonging to this application only
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the selection.
   * @param boolean $count If true the total number of records instead of a list
   * @param boolean $distinct Whether to use the DISTINCT sql keyword
   * @param boolean $id_only Whether to return a list of primary ids instead of active records
   * @param boolean $full If true then records will not be restricted by application
   * @access public
   * @static
   */
  public static function select(
    $modifier = NULL, $count = false, $distinct = true, $id_only = false, $full = false )
  {
    if( !$full )
    {
      // make sure to only include cohorts belonging to this application
      if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'application_has_cohort.application_id', '=',
                        lib::create( 'business\session' )->get_application()->id );
    }

    return parent::select( $modifier, $count, $distinct, $id_only );
  }

  /**
   * Override parent method by restricting returned records to those belonging to this application only
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string|array $column A column with the unique key property (or array of columns)
   * @param string|array $value The value of the column to match (or array of values)
   * @param boolean $full If true then records will not be restricted by application
   * @return database\record
   * @static
   * @access public
   */
  public static function get_unique_record( $column, $value, $full = false )
  {
    $db_cohort = parent::get_unique_record( $column, $value );

    if( !$full )
    {
      $application_mod = lib::create( 'database\modifier' );
      $application_mod->where(
        'application_id', '=', lib::create( 'business\session' )->get_application()->id );
      if( !is_null( $db_cohort ) &&
          0 == $db_cohort->get_application_count( $application_mod ) ) $db_cohort = NULL;
    }

    return $db_cohort;
  }

  /**
   * Make sure to only include applications which this cohort has access to.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $record_type The type of record.
   * @param modifier $modifier A modifier to apply to the list or count.
   * @param boolean $inverted Whether to invert the count (count records NOT in the joining table).
   * @param boolean $count If true then this method returns the count instead of list of records.
   *r@param boolean $distinct Whether to use the DISTINCT sql keyword
   * @param boolean $id_only Whether to return a list of primary ids instead of active records
   * @return array( record ) | array( int ) | int
   * @access protected
   */
  public function get_record_list(
    $record_type,
    $modifier = NULL,
    $inverted = false,
    $count = false,
    $distinct = true,
    $id_only = false )
  { 
    if( 'application' == $record_type )
    {
      if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'application_has_cohort.application_id', '=',
                        lib::create( 'business\session' )->get_application()->id );
    }                   
    return parent::get_record_list(
      $record_type, $modifier, $inverted, $count, $distinct, $id_only );
  }
}
