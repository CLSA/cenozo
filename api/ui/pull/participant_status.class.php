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

    $database_class_name = lib::get_class_name( 'database\database' );
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $service_class_name = lib::get_class_name( 'database\service' );
    $timezone = lib::create( 'business\session' )->get_site()->timezone;

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
    $modifier = lib::create( 'database\modifier' );
    foreach( $service_list as $db_service )
    {
      $event = $db_service->name.'_event';
      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'participant.id', '=', $event.'.participant_id', false );
      $join_mod->where( $event.'.event_type_id', '=', $db_service->release_event_type_id );
      $modifier->left_join( 'event AS '.$event, $join_mod );
    }
      
    $modifier->left_join( 'collection_has_participant',
      'participant.id', 'collection_has_participant.participant_id' );
    $modifier->left_join( 'collection',
      'collection_has_participant.collection_id', 'collection.id' );
    $modifier->join( 'last_consent',
      'participant.id', 'last_consent.participant_id' );
    $modifier->left_join( 'consent AS lconsent',
      'last_consent.consent_id', 'lconsent.id' );
    $modifier->join( 'written_consent',
      'participant.id', 'written_consent.participant_id' );
    $modifier->left_join( 'consent AS wconsent',
      'written_consent.consent_id', 'wconsent.id' );
    $modifier->left_join( 'participant_primary_address',
      'participant.id', 'participant_primary_address.participant_id' );
    $modifier->left_join( 'address',
      'participant_primary_address.address_id', 'address.id' );
    $modifier->left_join( 'region', 'address.region_id', 'region.id' );
    $modifier->left_join( 'state', 'participant.state_id', 'state.id' );
    $modifier->where( 'IFNULL( collection.active, true )', '=', true );
    $modifier->group( 'participant.id' );
    $modifier->order( 'participant.uid' );

    $this->data = array();
    $sql =
      'SELECT uid, '.
        'IFNULL( region.name, "None" ) AS region, '.
        'IFNULL( state.name, "" ) AS state, ';

    foreach( $service_list as $db_service )
      $sql .= sprintf(
        'IFNULL( DATE( CONVERT_TZ( %s_event.datetime, %s, "UTC" ) ), "" ) AS %s_release, ',
        $db_service->name,
        $database_class_name::format_string( $timezone ),
        $db_service->name );

    $sql .=
        'IFNULL( lconsent.accept, "" ) AS last_consent, '.
        'IFNULL( lconsent.date, "" ) AS last_consent_date, '.
        'IFNULL( wconsent.accept, false ) AS written_consent, '.
        'IFNULL( wconsent.date, "" ) AS written_consent_date, '.
        'IFNULL( GROUP_CONCAT( collection.name ), "" ) AS collections '.
      'FROM participant ';

    $this->data = $participant_class_name::db()->get_all( $sql.$modifier->get_sql() );
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
