<?php
/**
 * equipment.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * equipment: record
 */
class equipment extends record
{
  /**
   * Returns the open loan record (NULL if the equipment isn't on loan)
   * @return database\equipment_loan
   */
  public function get_current_equipment_loan()
  {
    $equipment_loan_mod = lib::create( 'database\modifier' );
    $equipment_loan_mod->order( '-end_datetime' ); // put null values first
    $equipment_loan_mod->limit( 1 );
    $equipment_loan_list = $this->get_equipment_loan_object_list( $equipment_loan_mod );
    return 0 < count( $equipment_loan_list ) ? current( $equipment_loan_list ) : NULL;
  }
}
