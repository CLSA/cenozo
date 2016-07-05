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
   * TODO: document
   */
  public function get_executer()
  {
    return lib::create( sprintf( 'business\report\%s', $this->get_report_type()->name ), $this );
  }
}
