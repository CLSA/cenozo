<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\log_entry;
use cenozo\lib, cenozo\log;

class query extends \cenozo\service\query
{
  /**
   * Extends parent method
   */
  protected function execute()
  {
    // update the log if it's out of date
    $log_entry_class_name = lib::get_class_name( 'database\log_entry' );
    $log_entry_class_name::update();

    parent::execute();
  }
}
