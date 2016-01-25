<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\event_type;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\site_restricted_module
{
  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $db_application = lib::create( 'business\session' )->get_application();

    // add the total number of events
    if( $select->has_column( 'event_count' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'event' );
      $join_sel->add_column( 'event_type_id' );
      $join_sel->add_column( 'COUNT(*)', 'event_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->group( 'event_type_id' );

      // restrict to participants in this application
      if( $db_application->release_based )
      {
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where( 'event.participant_id', '=', 'application_has_participant.participant_id', false );
        $sub_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
        $sub_mod->where( 'application_has_participant.datetime', '!=', NULL );
        $join_mod->join_modifier( 'application_has_participant', $sub_mod );
      }

      // restrict by site
      $db_restrict_site = $this->get_restricted_site();
      if( !is_null( $db_restrict_site ) )
      {
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where( 'event.participant_id', '=', 'participant_site.participant_id', false );
        $sub_mod->where( 'participant_site.application_id', '=', $db_application->id );
        $sub_mod->where( 'participant_site.site_id', '=', $db_restrict_site->id );
        $join_mod->join_modifier( 'participant_site', $sub_mod );
      }

      $modifier->left_join(
        sprintf( '( %s %s ) AS event_type_join_event', $join_sel->get_sql(), $join_mod->get_sql() ),
        'event_type.id',
        'event_type_join_event.event_type_id' );
      $select->add_column( 'IFNULL( event_count, 0 )', 'event_count', false );
    }
  }
}
