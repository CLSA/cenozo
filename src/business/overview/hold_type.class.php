<?php
/**
 * overview.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\business\overview;
use cenozo\lib, cenozo\log;

/**
 * overview: hold_type
 */
class hold_type extends \cenozo\business\overview\base_overview
{
  /**
   * Implements abstract method
   */
  protected function build( $modifier = NULL )
  {
    $session = lib::create( 'business\session' );
    $db_application = $session->get_application();
    $db_role = $session->get_role();
    $db_site = $session->get_site();
    $participant_class_name = lib::get_class_name( 'database\participant' );

    $base_mod = lib::create( 'database\modifier' );
    $base_mod->where( 'participant.exclusion_id', '=', NULL );
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

    $participant_class_name = lib::get_class_name( 'database\participant' );
    
    $participant_sel = lib::create( 'database\select' );
    $participant_sel->add_table_column( 'hold_type', 'type' );
    $participant_sel->add_table_column( 'hold_type', 'name' );
    $participant_sel->add_column( 'COUNT(*)', 'total', false );
    $participant_mod = lib::create( 'database\modifier' );
    $participant_mod->join( 'participant_last_hold', 'participant.id', 'participant_last_hold.participant_id' );
    $participant_mod->join( 'hold', 'participant_last_hold.hold_id', 'hold.id' );
    $participant_mod->join( 'hold_type', 'hold.hold_type_id', 'hold_type.id' );
    $participant_mod->merge( $base_mod );
    $participant_mod->group( 'hold_type.id' );
    $participant_mod->order( 'hold_type.type' );
    $participant_mod->order( 'hold_type.name' );
    foreach( $participant_class_name::select( $participant_sel, $participant_mod ) as $hold_type )
    {
      $this->add_root_item(
        $hold_type['type'].': '.$hold_type['name'],
        sprintf( '%d (%0.2f%%)', $hold_type['total'], 100 * $hold_type['total'] / $total )
      );
    }
  }
}
