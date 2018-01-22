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

    // create a temporary table to hold the last non-empty trace for all participants
    $sql =
      "CREATE TEMPORARY TABLE participant_last_active_trace\n".
      "SELECT participant.id AS participant_id, trace.id AS trace_id\n".
      "FROM participant\n".
      "LEFT JOIN trace ON participant.id = trace.participant_id\n".
      "AND trace.datetime <=> (\n".
      "  SELECT MAX( datetime )\n".
      "  FROM trace\n".
      "  WHERE participant.id = trace.participant_id\n".
      "  AND trace.trace_type_id IS NOT NULL\n".
      "  GROUP BY trace.participant_id\n".
      "  LIMIT 1\n".
      ")";
    $participant_class_name::db()->execute( $sql );

    // create the base participant mod used by both the overall and individual site queries
    $participant_mod = lib::create( 'database\modifier' );
    $participant_mod->merge( $base_mod );
    $join_mod = lib::create( 'database\modifier' );
    $join_mod->where( 'participant.id', '=', 'trace.participant_id', false );
    $join_mod->where( 'trace.trace_type_id', '!=', NULL );
    $participant_mod->join_modifier( 'trace', $join_mod );
    $participant_mod->group( 'participant.id' );

    // create the base trace_type mod used by both the overall and individual site queries
    $trace_type_sel = lib::create( 'database\select' );
    $trace_type_sel->add_column( 'name' );
    $trace_type_sel->add_column( 'last_trace.trace_type_id IS NULL', 'resolved', false );
    $trace_type_sel->add_column( 'COUNT(*)', 'total', false );
    $trace_type_mod = lib::create( 'database\modifier' );
    $trace_type_mod->join( 'trace', 'trace_type.id', 'trace.trace_type_id' );
    $trace_type_mod->join(
      'participant_last_active_trace', 'trace.participant_id', 'participant_last_active_trace.participant_id' );
    $trace_type_mod->join( 'participant', 'participant_last_active_trace.participant_id', 'participant.id' );
    $trace_type_mod->join(
      'participant_last_trace', 'trace.participant_id', 'participant_last_trace.participant_id' );
    $trace_type_mod->join( 'trace', 'participant_last_trace.trace_id', 'last_trace.id', '', 'last_trace' );
    $trace_type_mod->merge( $base_mod );
    $trace_type_mod->group( 'trace_type.id' );
    $trace_type_mod->group( 'last_trace.trace_type_id IS NULL' );
    $trace_type_mod->order( 'trace_type.name' );
    $trace_type_mod->order_desc( 'last_trace.trace_type_id IS NULL' );

    if( $db_role->all_sites )
    {
      $node = $this->add_root_item( 'All Sites' );

      // get the total number of participants who have ever been in tracing
      $all_participant_mod = clone $participant_mod;
      $total = $participant_class_name::count( $all_participant_mod );

      // break down the participants who have been in tracing
      $all_trace_type_sel = clone $trace_type_sel;
      $all_trace_type_mod = clone $trace_type_mod;
      foreach( $trace_type_class_name::select( $all_trace_type_sel, $all_trace_type_mod ) as $trace_type )
      {
        $this->add_item( $node,
          $trace_type['name'].( $trace_type['resolved'] ? ' resolved' : '' ),
          sprintf( '%d (%0.1f%%)', $trace_type['total'], 100 * $trace_type['total'] / $total )
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
        $site_participant_mod = clone $participant_mod;
        $site_participant_mod->where( 'participant_site.site_id', '=', $site['id'] );
        $total = $participant_class_name::count( $site_participant_mod );

        $site_trace_type_sel = clone $trace_type_sel;
        $site_trace_type_mod = clone $trace_type_mod;
        $site_trace_type_mod->where( 'participant_site.site_id', '=', $site['id'] );
        foreach( $trace_type_class_name::select( $site_trace_type_sel, $site_trace_type_mod ) as $trace_type )
        {
          $this->add_item( $node,
            $trace_type['name'].( $trace_type['resolved'] ? ' resolved' : '' ),
            sprintf( '%d (%0.1f%%)', $trace_type['total'], 100 * $trace_type['total'] / $total )
          );
        }
      }
    }
  }
}
