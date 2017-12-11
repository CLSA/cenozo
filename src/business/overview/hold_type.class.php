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
  protected function build()
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

    $hold_type_class_name = lib::get_class_name( 'database\hold_type' );
    
    $hold_type_sel = lib::create( 'database\select' );
    $hold_type_sel->add_column( 'type' );
    $hold_type_sel->add_column( 'name' );
    $hold_type_sel->add_column( 'COUNT(*)', 'total', false );
    $hold_type_mod = lib::create( 'database\modifier' );
    $hold_type_mod->join( 'hold', 'hold_type.id', 'hold.hold_type_id' );
    $hold_type_mod->join( 'participant_last_hold', 'hold.participant_id', 'participant_last_hold.participant_id' );
    $hold_type_mod->join( 'participant', 'participant_last_hold.participant_id', 'participant.id' );
    $hold_type_mod->merge( $base_mod );
    $hold_type_mod->group( 'hold_type.id' );
    $hold_type_mod->order( 'hold_type.type' );
    $hold_type_mod->order( 'hold_type.name' );
    foreach( $hold_type_class_name::select( $hold_type_sel, $hold_type_mod ) as $hold_type )
    {
      $this->add_root_item(
        $hold_type['type'].': '.$hold_type['name'],
        sprintf( '%d (%0.2f%%)', $hold_type['total'], 100 * $hold_type['total'] / $total )
      );
    }
  }
}
