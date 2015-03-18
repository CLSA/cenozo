<?php
/**
 * consent.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * consent: record
 */
class consent extends record
{
  /**
   * Override parent save method by not allowing new consent records once a participant's
   * withdraw letter has been set
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function save()
  {
    if( $this->accept )
    {
      if( !is_null( $this->participant_id ) )
      {
        $db_participant = lib::create( 'database\participant', $this->participant_id );
        if( !is_null( $db_participant->withdraw_letter ) )
        {
          throw lib::create( 'exception\notice',
            'The participant has completed the withdraw script, '.
            'no changes to consent status are allowed.', __METHOD__ );
        }
      }
    }

    parent::save();
  }
  
  /**
   * Returns a string representation of the consent (eg: verbal deny, written accept, etc)
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function to_string()
  {
    return sprintf( '%s %s',
                    $this->written ? 'written' : 'verbal',
                    $this->accept ? 'accept' : 'deny' );
  }
}
