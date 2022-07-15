<?php
/**
 * equipment_loan.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * equipment_loan: record
 */
class equipment_loan extends record
{
  /** 
   * Override parent save method by making sure only one participant can have the equipment at a time
   * 
   * @throws exception\permission
   * @access public
   */
  public function save()
  {
    if( is_null( $this->end_datetime ) )
    {
      $select = lib::create( 'database\select' );
      $select->add_table_column( 'participant', 'uid' );
      $modifier = lib::create( 'database\modifier' );
      $modifier->join( 'participant', 'equipment_loan.participant_id', 'participant.id' );
      if( !is_null( $this->id ) ) $modifier->where( 'equipment_loan.id', '!=', $this->id );
      $modifier->where( 'equipment_id', '=', $this->equipment_id );
      $modifier->where( 'end_datetime', '=', NULL );
      $equipment_loan_list = static::select( $select, $modifier );
      if( 0 < count( $equipment_loan_list ) )
      {
        $uid = current( $equipment_loan_list )['uid'];
        throw lib::create( 'exception\notice',
          sprintf(
            'Unable to proceed as the equipment is already on loan to %s.  '.
            'Please make sure that the equipment is not already on loan.',
            $uid
          ),
          __METHOD__
        );
      }
    }

    parent::save();
  }
}
