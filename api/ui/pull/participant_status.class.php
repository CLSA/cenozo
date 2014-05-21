<?php
/**
 * participant_status.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\pull;
use cenozo\lib, cenozo\log;

/**
 * Class for participant status pull operations.
 * 
 * @abstract
 */
class participant_status extends \cenozo\ui\pull
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Pull arguments.
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'participant', 'status', $args );
  }

  /**
   * This method executes the operation's purpose.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function execute()
  {
    parent::execute();

    $participant_class_name = lib::get_class_name( 'database\participant' );

    $this->data = array();
    $sql =
      'SELECT uid, '.
        'IFNULL( region.name, "None" ) AS region, '.
        'IFNULL( state.name, "" ) AS state, '.
        'IFNULL( participant_last_consent.accept, "" ) AS last_consent, '.
        'IFNULL( participant_last_written_consent.accept, false ) AS written_consent '.
      'FROM participant '.
      'JOIN participant_last_consent '.
      'ON participant.id = participant_last_consent.participant_id '.
      'JOIN participant_last_written_consent '.
      'ON participant.id = participant_last_written_consent.participant_id '.
      'LEFT JOIN participant_primary_address '.
      'ON participant.id = participant_primary_address.participant_id '.
      'LEFT JOIN address ON participant_primary_address.address_id = address.id '.
      'LEFT JOIN region ON address.region_id = region.id '.
      'LEFT JOIN state ON participant.state_id = state.id '.
      'ORDER BY uid';

    $this->data = $participant_class_name::db()->get_all( $sql );
  }

  /**
   * Lists are always returned in JSON format.
   * 
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_data_type() { return 'json'; }
}
