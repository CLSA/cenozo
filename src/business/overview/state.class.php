<?php
/**
 * overview.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\business\overview;
use cenozo\lib, cenozo\log;

/**
 * overview: withdraw
 */
class state extends \cenozo\business\overview\base_overview
{
  /**
   * Implements abstract method
   */
  protected function build()
  {
    $session = lib::create( 'business\session' );
    $db_application = $session->get_application();
    $db_role = $session->get_role();
    $db_site = $session->get_site();
    $participant_class_name = lib::get_class_name( 'database\participant' );

    $base_mod = lib::create( 'database\modifier' );
    if( $db_application->release_based )
    {
      $base_mod->join(
        'application_has_participant', 'participant.id', 'application_has_participant.participant_id' );
      $base_mod->join( 'application', 'application_has_participant.application_id', 'application.id' );
      $base_mod->where( 'application.id', '=', $db_application->id );
      $base_mod->where( 'application_has_participant.datetime', '!=', NULL );
    }
    else if( 'mastodon' != $db_application->name )
    {
      $base_mod->join(
        'application_has_cohort', 'participant.cohort_id', 'application_has_cohort.cohort_id' );
      $base_mod->join( 'application', 'application_has_cohort.application_id', 'application.id' );
      $base_mod->where( 'application.id', '=', $db_application->id );
    }

    if( !$db_role->all_sites && 'mastodon' != $db_application->name )
    {
      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'participant.id', '=', 'participant_site.participant_id', false );
      $join_mod->where( 'participant_site.application_id', '=', $db_application->id );
      $base_mod->join_modifier( 'participant_site', $join_mod );
      $base_mod->where( 'participant_site.site_id', '=', $db_site->id );
    }

    // get the total number of participants
    $participant_mod = lib::create( 'database\modifier' );
    $participant_mod->merge( $base_mod );
    $total = $participant_class_name::count( $participant_mod );

    $state_class_name = lib::get_class_name( 'database\state' );
    
    $state_sel = lib::create( 'database\select' );
    $state_sel->add_column( 'name' );
    $state_sel->add_column( 'COUNT(*)', 'total', false );
    $state_mod = lib::create( 'database\modifier' );
    $state_mod->join( 'participant', 'state.id', 'participant.state_id' );
    $state_mod->merge( $base_mod );
    $state_mod->group( 'state.id' );
    $state_mod->order( 'rank' );
    foreach( $state_class_name::select( $state_sel, $state_mod ) as $state )
    {
      $this->add_root_item(
        $state['name'],
        sprintf( '%d (%0.2f%%)', $state['total'], 100 * $state['total'] / $total )
      );
    }
  }
}
