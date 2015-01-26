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
class participant_site_reassign extends \cenozo\ui\pull\base_participant_multi
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
    parent::__construct( 'site_reassign', $args );
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
    
    $db_appointment = lib::create( 'database\appointment', $this->get_argument( 'appointment_id' ) );
    $cohort_id_list = $db_appointment->get_cohort_idlist();
    $site_id = $this->get_argument( 'site_id' );
    
    // count how many participants in the UID list belong to the selected appointment
    $participant_mod = clone $this->modifier;
    $participant_mod->where( 'cohort_id', 'IN', $cohort_id_list );
    $participant_count = $participant_class_name::count( $participant_mod );
    $invalid_count = count( $this->uid_list ) - $participant_count;

    // count participant's whose effective site will be affected by the operation
    $participant_mod = clone $this->modifier;
    $participant_mod->where( 'participant_default_site.appointment_id', '=', $db_appointment->id );
    $participant_mod->where( 'participant_preferred_site.appointment_id', '=', $db_appointment->id );

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
      'Participants belonging to appointment' => $participant_count,
      'Participants not belonging to appointment' => $invalid_count,
      'Participants affected by operation' => $affected_count );
  }
}
