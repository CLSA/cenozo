<?php
/**
 * participant_site_reassign.class.php
 * 
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\pull;
use cenozo\lib, cenozo\log;

/**
 * Base class for all list pull operations.
 * 
 * @abstract
 */
class participant_site_reassign extends \cenozo\ui\pull
{
  /**
   * Constructor
   * 
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param array $args Pull arguments.
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'participant', 'site_reassign', $args );
  }

  /**
   * This method executes the operation's purpose.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function execute()
  {
    parent::execute();

    $participant_class_name = lib::get_class_name( 'database\participant' );

    $participant_count = 0;
    $invalid_count = 0;
    $affected_count = 0;
    
    $db_service = lib::create( 'database\service', $this->get_argument( 'service_id' ) );
    $cohort_id_list = array();
    foreach( $db_service->get_cohort_list() as $db_cohort ) $cohort_id_list[] = $db_cohort->id;
    $site_id = $this->get_argument( 'site_id' );
    $uid_list_string = preg_replace( '/[^a-zA-Z0-9]/', ' ', $this->get_argument( 'uid_list' ) );
    $uid_list_string = trim( $uid_list_string );
    $uid_list = array_unique( preg_split( '/\s+/', $uid_list_string ) );
    
    // count how many participants in the UID list belong to the selected service
    $participant_mod = lib::create( 'database\modifier' );
    $participant_mod->where( 'uid', 'IN', $uid_list );
    $participant_mod->where( 'cohort_id', 'IN', $cohort_id_list );
    $participant_count = $participant_class_name::count( $participant_mod );
    $invalid_count = count( $uid_list ) - $participant_count;

    // count participant's whose effective site will be affected by the operation
    $participant_mod = lib::create( 'database\modifier' );
    $participant_mod->where( 'uid', 'IN', $uid_list );
    $participant_mod->where( 'service_has_participant.service_id', '=', $db_service->id );
    $participant_mod->where( 'participant_default_site.service_id', '=', $db_service->id );
    $participant_mod->where( 'participant_preferred_site.service_id', '=', $db_service->id );

    if( 0 < $site_id )
    { // the new site is different from the preferred, or if there is no preferred then
      // different from the default
      $participant_mod->where( $site_id, '!=',
        'COALESCE( participant_preferred_site.site_id, participant_default_site.site_id )', false );
    }
    else
    { // participants with a preferred site which is not the default site are affected
      $participant_mod->where(
        'participant_preferred_site.site_id', '!=', NULL );
      $participant_mod->where(
        'participant_default_site.site_id', '!=', 'participant_preferred_site.site_id', false );
    }

    $affected_count = $participant_class_name::count( $participant_mod );

    $this->data = array(
      'Participants belonging to service' => $participant_count,
      'Participants not belonging to service' => $invalid_count,
      'Participants affected by operation' => $affected_count );
  }
  
  /**
   * Lists are always returned in JSON format.
   * 
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_data_type() { return "json"; }
}
