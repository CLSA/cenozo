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
   * @throws exception\permission
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

  /**
   * Custom sql function used to get the number of withdraws.
   * The modifier argument may include columns in the participant, address, region and consent
   * tables.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return integer
   * @static
   * @access public
   */
  public static function get_withdraw_count( $modifier = NULL )
  {
    // need custom SQL
    return static::db()->get_one(
      'SELECT count( DISTINCT participant.id ) '.
      'FROM participant '.
      'JOIN consent written_consent ON participant.id = written_consent.participant_id '.
      'AND written_consent.accept = 1 AND written_consent.written = 1 '.
      'JOIN participant_primary_address ON participant.id = participant_primary_address.participant_id '.
      'JOIN address ON participant_primary_address.address_id = address.id '.
      'JOIN region ON address.region_id = region.id '.
      'JOIN participant_last_consent ON participant.id = participant_last_consent.participant_id '.
      'JOIN consent ON participant_last_consent.consent_id = consent.id AND consent.accept = 0 '.
      ( is_null( $modifier ) ? '' : $modifier->get_sql() ) );
  }
}
