<?php
/**
 * quota.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filequota
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * quota: record
 */
class quota extends record
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
      // make sure to only include quotas belonging to this application
      if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
      $modifier->where(
        'site.application_id', '=', lib::create( 'business\session' )->get_application()->id );
    }

    return parent::select( $modifier, $count, $distinct, $format );
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
    $db_quota = parent::get_unique_record( $column, $value );

    if( !$full )
    {
      if( !is_null( $db_quota ) &&
          $db_quota->get_site()->application_id !=
            lib::create( 'business\session' )->get_application()->id ) $db_quota = NULL;
    }

    return $db_quota;
  }
}
