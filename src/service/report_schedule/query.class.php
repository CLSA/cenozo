<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\report_schedule;
use cenozo\lib, cenozo\log;

/**
 * Extends parent class
 */
class query extends \cenozo\service\query
{
  /**
   * Extends parent method
   */
  protected function execute()
  {
    parent::execute();

    if( $this->get_argument( 'update', false ) )
    {
      $report_schedule_class_name = lib::get_class_name( 'database\report_schedule' );
      $report_schedule_class_name::update_all();
    }
  }
}
