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

    // first create temporary tables with the consent information
    $sql =
      'CREATE TEMPORARY TABLE last_consent '.
      'SELECT participant_id, accept '.
      'FROM participant_last_consent';
    $participant_class_name::db()->execute( $sql );
    $sql =
      'ALTER TABLE last_consent '.
      'ADD INDEX participant ( participant_id ASC )';
    $participant_class_name::db()->execute( $sql );

    $sql =
      'CREATE TEMPORARY TABLE written_consent '.
      'SELECT participant_id, accept '.
      'FROM participant_last_written_consent';
    $participant_class_name::db()->execute( $sql );
    $sql =
      'ALTER TABLE written_consent '.
      'ADD INDEX participant ( participant_id ASC )';
    $participant_class_name::db()->execute( $sql );

    $this->data = array();
    $sql =
      'SELECT uid, '.
        'IFNULL( region.name, "None" ) AS region, '.
        'IFNULL( state.name, "" ) AS state, '.
        'IFNULL( last_consent.accept, "" ) AS last_consent, '.
        'IFNULL( written_consent.accept, false ) AS written_consent '.
      'FROM participant '.
      'JOIN last_consent ON participant.id = last_consent.participant_id '.
      'JOIN written_consent ON participant.id = written_consent.participant_id '.
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
