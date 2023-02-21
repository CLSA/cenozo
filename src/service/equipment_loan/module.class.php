<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\equipment_loan;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\module
{
  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $modifier->join( 'participant', 'equipment_loan.participant_id', 'participant.id' );
    $modifier->join( 'equipment', 'equipment_loan.equipment_id', 'equipment.id' );
    $modifier->join( 'equipment_type', 'equipment.equipment_type_id', 'equipment_type.id' );

    if( !is_null( $this->get_resource() ) )
    {
      // include the participant first/last/uid as supplemental data
      $select->add_column(
        'CONCAT( participant.first_name, " ", participant.last_name, " (", participant.uid, ")" )',
        'formatted_participant_id',
        false
      );

      // include the equipment serial number as supplemental data
      $select->add_column(
        'CONCAT( equipment_type.name, ": ", equipment.serial_number )',
        'formatted_equipment_id',
        false
      );
    }
  }
}
