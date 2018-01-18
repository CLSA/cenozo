<?php
/**
 * overview.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\business\overview;
use cenozo\lib, cenozo\log;

/**
 * overview: tracing
 */
class tracing extends \cenozo\business\overview\base_overview
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
    $trace_type_class_name = lib::get_class_name( 'database\trace_type' );

    $base_mod = lib::create( 'database\modifier' );
    $base_mod->where( 'participant.exclusion_id', '=', NULL );

    $base_mod->join( 'participant_last_hold', 'participant.id', 'participant_last_hold.participant_id' );
    $base_mod->left_join( 'hold', 'participant_last_hold.hold_id', 'hold.id' );
    $base_mod->left_join( 'hold_type', 'hold.hold_type_id', 'hold_type.id' );
    $base_mod->where( 'IFNULL( hold_type.type, "" )', '!=', 'final' );

    $site_node_list = array();

    if( $db_application->release_based )
    {
      $base_mod->join(
        'application_has_participant', 'participant.id', 'application_has_participant.participant_id' );
      $base_mod->join( 'application', 'application_has_participant.application_id', 'application.id' );
      $base_mod->where( 'application.id', '=', $db_application->id );
      $base_mod->where( 'application_has_participant.datetime', '!=', NULL );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'participant.id', '=', 'participant_site.participant_id', false );
      $join_mod->where( 'participant_site.application_id', '=', $db_application->id );
      $base_mod->join_modifier( 'participant_site', $join_mod );
      if( !$db_role->all_sites ) $base_mod->where( 'participant_site.site_id', '=', $db_site->id );
    }
    else if( 'mastodon' != $db_application->name )
    {
      $base_mod->join(
        'application_has_cohort', 'participant.cohort_id', 'application_has_cohort.cohort_id' );
      $base_mod->join( 'application', 'application_has_cohort.application_id', 'application.id' );
      $base_mod->where( 'application.id', '=', $db_application->id );
    }

    if( $db_role->all_sites )
    {
      // get the total number of participants
      $participant_mod = lib::create( 'database\modifier' );
      $participant_mod->merge( $base_mod );
      $total = $participant_class_name::count( $participant_mod );

      $trace_type_sel = lib::create( 'database\select' );
      $trace_type_sel->add_column( 'name' );
      $trace_type_sel->add_column( 'COUNT(*)', 'total', false );
      $trace_type_mod = lib::create( 'database\modifier' );
      $trace_type_mod->join( 'trace', 'trace_type.id', 'trace.trace_type_id' );
      $trace_type_mod->join(
        'participant_last_trace', 'trace.participant_id', 'participant_last_trace.participant_id' );
      $trace_type_mod->join( 'participant', 'participant_last_trace.participant_id', 'participant.id' );
      $trace_type_mod->merge( $base_mod );
      $trace_type_mod->group( 'trace_type.id' );
      $trace_type_mod->order( 'trace_type.name' );
      $node = $this->add_root_item( 'All Sites' );
      foreach( $trace_type_class_name::select( $trace_type_sel, $trace_type_mod ) as $trace_type )
      {
        $this->add_item( $node,
          $trace_type['name'],
          sprintf( '%d (%0.2f%%)', $trace_type['total'], 100 * $trace_type['total'] / $total )
        );
      }
    }

    if( 'mastodon' != $db_application->name )
    {
      // create an entry for each site
      $site_mod = lib::create( 'database\modifier' );
      $site_mod->order( 'name' );
      if( !$db_role->all_sites ) $site_mod->where( 'site.id', '=', $db_site->id );
      $site_sel = lib::create( 'database\select' );
      $site_sel->add_table_column( 'site', 'id' );
      $site_sel->add_table_column( 'site', 'name' );
      foreach( $db_application->get_site_list( $site_sel, $site_mod ) as $site )
      {   
        $node = $this->add_root_item( $site['name'] );

        // get the total number of participants
        $participant_mod = lib::create( 'database\modifier' );
        $participant_mod->merge( $base_mod );
        $participant_mod->where( 'participant_site.site_id', '=', $site['id'] );
        $total = $participant_class_name::count( $participant_mod );

        $trace_type_sel = lib::create( 'database\select' );
        $trace_type_sel->add_column( 'name' );
        $trace_type_sel->add_column( 'COUNT(*)', 'total', false );
        $trace_type_mod = lib::create( 'database\modifier' );
        $trace_type_mod->join( 'trace', 'trace_type.id', 'trace.trace_type_id' );
        $trace_type_mod->join(
          'participant_last_trace', 'trace.participant_id', 'participant_last_trace.participant_id' );
        $trace_type_mod->join( 'participant', 'participant_last_trace.participant_id', 'participant.id' );
        $trace_type_mod->merge( $base_mod );
        $trace_type_mod->where( 'participant_site.site_id', '=', $site['id'] );
        $trace_type_mod->group( 'trace_type.id' );
        $trace_type_mod->order( 'trace_type.name' );
        foreach( $trace_type_class_name::select( $trace_type_sel, $trace_type_mod ) as $trace_type )
        {
          $this->add_item( $node,
            $trace_type['name'],
            sprintf( '%d (%0.2f%%)', $trace_type['total'], 100 * $trace_type['total'] / $total )
          );
        }
      }
    }
  }
}
