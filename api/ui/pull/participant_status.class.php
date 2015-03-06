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

    $session = lib::create( 'business\session' );
    $db = $session->get_database();
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $service_class_name = lib::get_class_name( 'database\service' );
    $timezone = $session->get_site()->timezone;

    // first create temporary tables with the consent information
    $sql =
      'CREATE TEMPORARY TABLE last_consent '.
      'SELECT participant_id, consent_id '.
      'FROM participant_last_consent';
    $participant_class_name::db()->execute( $sql );
    $sql =
      'ALTER TABLE last_consent '.
      'ADD INDEX participant ( participant_id ASC ), '.
      'ADD INDEX consent ( consent_id ASC )';
    $participant_class_name::db()->execute( $sql );

    $sql =
      'CREATE TEMPORARY TABLE written_consent '.
      'SELECT participant_id, consent_id '.
      'FROM participant_last_written_consent';
    $participant_class_name::db()->execute( $sql );
    $sql =
      'ALTER TABLE written_consent '.
      'ADD INDEX participant ( participant_id ASC ), '.
      'ADD INDEX consent ( consent_id ASC )';
    $participant_class_name::db()->execute( $sql );

    // get a list of all release-based services
    $service_mod = lib::create( 'database\modifier' );
    $service_mod->where( 'release_based', '=', true );
    $service_mod->order( 'name' );
    $service_list = $service_class_name::select( $service_mod );

    // now build the custom query
    $this->data = array();
    $sql =
      'SELECT uid, '.
        'IFNULL( region.name, "None" ) AS region, '.
        'IFNULL( state.name, "" ) AS state, ';

    foreach( $service_list as $db_service )
      $sql .= sprintf(
        'IFNULL( DATE( CONVERT_TZ( %s_event.datetime, %s, "UTC" ) ), "" ) AS %s_release, ',
        $db_service->name,
        $db->format_string( $timezone ),
        $db_service->name );

    $sql .=
        'IFNULL( lconsent.accept, "" ) AS last_consent, '.
        'IFNULL( lconsent.date, "" ) AS last_consent_date, '.
        'IFNULL( wconsent.accept, false ) AS written_consent, '.
        'IFNULL( wconsent.date, "" ) AS written_consent_date, '.
        'IFNULL( GROUP_CONCAT( collection.name ), "" ) AS collections '.
      'FROM participant ';

    foreach( $service_list as $db_service )
      $sql .= sprintf(
        'LEFT JOIN event AS %s_event '.
        'ON participant.id = %s_event.participant_id '.
        'AND %s_event.event_type_id = %s ',
        $db_service->name,
        $db_service->name,
        $db_service->name,
        $db->format_string( $db_service->release_event_type_id ) );
      
    $sql .=
      'LEFT JOIN collection_has_participant '.
      'ON participant.id = collection_has_participant.participant_id '.
      'LEFT JOIN collection '.
      'ON collection_has_participant.collection_id = collection.id '.
      'JOIN last_consent ON participant.id = last_consent.participant_id '.
      'LEFT JOIN consent AS lconsent ON last_consent.consent_id = lconsent.id '.
      'JOIN written_consent ON participant.id = written_consent.participant_id '.
      'LEFT JOIN consent AS wconsent ON written_consent.consent_id = wconsent.id '.
      'LEFT JOIN participant_primary_address '.
      'ON participant.id = participant_primary_address.participant_id '.
      'LEFT JOIN address ON participant_primary_address.address_id = address.id '.
      'LEFT JOIN region ON address.region_id = region.id '.
      'LEFT JOIN state ON participant.state_id = state.id '.
      'WHERE IFNULL( collection.active, true ) = true '.
      'GROUP BY participant.id '.
      'ORDER BY participant.uid';

    $this->data = $participant_class_name::db()->get_all( $sql );
  }

  /**
   * Lists are always returned in JSON format.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_data_type() { return 'json'; }
}
