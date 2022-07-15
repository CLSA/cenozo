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
  }
}
