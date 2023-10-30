<?php
/**
 * get.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\log_entry;
use cenozo\lib, cenozo\log;

/**
 * Special service for handling
 */
class get extends \cenozo\service\get
{
  /**
   * Override parent method
   */
  protected function prepare()
  {
    parent::prepare();

    // there are no timestamp columns in the log_entry table
    $this->select->remove_column_by_column( 'create_timestamp' );
    $this->select->remove_column_by_column( 'update_timestamp' );
  }
}
