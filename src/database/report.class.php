<?php
/**
 * report.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return business\report\*
   * @access public
   */
  public function get_executer()
  {
    return lib::create( sprintf( 'business\report\%s', $this->get_report_type()->name ), $this );
  }

  /**
   * Copies the parent report schedule's restrictions into this report.
   * This method is for reports linked to a report schedule only.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
    $select->add_constant( NULL, 'create_timestamp' );
    $select->add_column( 'id' );
    $select->add_table_column( 'report_schedule_has_report_restriction', 'report_restriction_id' );
    $select->add_table_column( 'report_schedule_has_report_restriction', 'value' );
    $modifier = lib::create( 'database\modifier' );
    $modifier->join( 'report_schedule', 'report.report_schedule_id', 'report_schedule.id' );
    $modifier->join(
      'report_schedule_has_report_restriction',
      'report_schedule.id',
      'report_schedule_has_report_restriction.report_schedule_id' );
    $modifier->where( 'report.id', '=', $this->id );

    static::db()->execute( sprintf(
      "INSERT INTO report_has_report_restriction( create_timestamp, report_id, report_restriction_id, value )\n".
      "%s\n%s",
      $select->get_sql(),
      $modifier->get_sql() ) );
  }
}
