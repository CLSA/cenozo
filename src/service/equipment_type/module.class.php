<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\equipment_type;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\site_restricted_module
{
  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    // count the total number of equipment
    $this->add_count_column( 'equipment_count', 'equipment', $select, $modifier );

    // count new equipment
    $this->add_count_column(
      'equipment_new_count',
      'equipment',
      $select,
      $modifier,
      NULL,
      'SUM(status="new")', // only count equipment that has status = "NEW"
      NULL,
      'new_equipment' // we must use a unique join table name
    );

    // count loaned equipment
    $this->add_count_column(
      'equipment_loaned_count',
      'equipment',
      $select,
      $modifier,
      NULL,
      'SUM(status="loaned")', // only count equipment that has status = "NEW"
      NULL,
      'loaned_equipment' // we must use a unique join table name
    );

    // count returned equipment
    $this->add_count_column(
      'equipment_returned_count',
      'equipment',
      $select,
      $modifier,
      NULL,
      'SUM(status="returned")', // only count equipment that has status = "NEW"
      NULL,
      'returned_equipment' // we must use a unique join table name
    );

    // count lost equipment
    $this->add_count_column(
      'equipment_lost_count',
      'equipment',
      $select,
      $modifier,
      NULL,
      'SUM(status="lost")', // only count equipment that has status = "NEW"
      NULL,
      'lost_equipment' // we must use a unique join table name
    );
  }
}
