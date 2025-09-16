<?php
/**
 * report.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * report: record
 */
class report extends base_report
{
  /**
   * Gets the report's business class (which generates the report)
   * 
   * @return business\report\*
   * @access public
   */
  public function get_executer()
  {
    return lib::create( sprintf( 'business\report\%s', $this->get_report_type()->name ), $this );
  }

  /**
   * Returns the restriction value for this report
   */
  public function get_restriction_value( $restriction_name )
  {
    $util_class_name = lib::get_class_name( 'util' );

    $select = lib::create( 'database\select' );
    $select->from( 'report_has_report_restriction' );
    $select->add_column( 'value' );
    $select->add_table_column( 'report_restriction', 'restriction_type' );
    $select->add_table_column( 'report_restriction', 'subject' );
    $modifier = lib::create( 'database\modifier' );
    $modifier->join(
      'report_restriction',
      'report_has_report_restriction.report_restriction_id',
      'report_restriction.id'
    );
    $modifier->where( 'report_id', '=', $this->id );
    $modifier->where( 'report_restriction.name', '=', $restriction_name );

    $row = static::db()->get_row( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );
    if( is_null( $row ) ) return NULL;

    $value = $row['value'];
    $type = $row['restriction_type'];
    $subject = $row['subject'];

    if( 'boolean' == $type )
    {
      $value = 1 == $value;
    }
    else if( in_array( $type, ['date', 'datetime', 'time'] ) )
    {
      $value = $util_class_name::get_datetime_object( $value );
    }

    return $value;
  }

  /**
   * Copies the parent report schedule's restrictions into this report.
   * This method is for reports linked to a report schedule only.
   * 
   * @access public
   */
  public function copy_report_schedule_restrictions()
  {
    // make sure this report is linked to a report_schedule
    if( is_null( $this->report_schedule_id ) )
    {
      throw lib::create( 'exception\runtime',
        'Tried to copy report schedule restrictions to report which is not linked to a schedule.',
        __METHOD__ );
    }

    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'report_id', '=', $this->id );
    static::db()->execute( sprintf( 'DELETE FROM report_has_report_restriction %s', $modifier->get_sql() ) );

    $select = lib::create( 'database\select' );
    $select->from( 'report' );
    $select->add_column( 'id' );
    $select->add_column( 'report_schedule_has_report_restriction.report_restriction_id', NULL, false );
    $select->add_column(
      'IF( '."\n".
      '    "date" = restriction_type,'."\n".
           // convert relative date values
      '    DATE_ADD( DATE( UTC_TIMESTAMP() ), INTERVAL report_schedule_has_report_restriction.value DAY ),'."\n".
      '    report_schedule_has_report_restriction.value'."\n".
      '  )',
      'value',
      false
    );
    $modifier = lib::create( 'database\modifier' );
    $modifier->join( 'report_schedule', 'report.report_schedule_id', 'report_schedule.id' );
    $modifier->join(
      'report_schedule_has_report_restriction',
      'report_schedule.id',
      'report_schedule_has_report_restriction.report_schedule_id' );
    $modifier->join(
      'report_restriction',
      'report_schedule_has_report_restriction.report_restriction_id',
      'report_restriction.id'
    );
    $modifier->where( 'report.id', '=', $this->id );

    static::db()->execute( sprintf(
      "INSERT INTO report_has_report_restriction( report_id, report_restriction_id, value )\n".
      "%s\n%s",
      $select->get_sql(),
      $modifier->get_sql() ) );
  }
}
