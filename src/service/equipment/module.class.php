<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\equipment;
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

    $modifier->join( 'equipment_type', 'equipment.equipment_type_id', 'equipment_type.id' );
    $equipment_loan_mod = lib::create( 'database\modifier' );
    $equipment_loan_mod->where( 'equipment.id', '=', 'equipment_loan.equipment_id', false );
    $equipment_loan_mod->where( 'equipment_loan.end_datetime', '=', NULL );
    $modifier->join_modifier( 'equipment_loan', $equipment_loan_mod, 'left' );
    $modifier->left_join( 'participant', 'equipment_loan.participant_id', 'participant.id' );
  }
}
