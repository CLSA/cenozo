<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\source;
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

    // add the total number of participants
    if( $select->has_column( 'participant_count' ) )
    {
      // to accomplish this we need to create two sub-joins, so start by creating the inner join
      $inner_join_sel = lib::create( 'database\select' );
      $inner_join_sel->from( 'participant' );
      $inner_join_sel->add_column( 'source_id' );
      $inner_join_sel->add_column( 'COUNT(*)', 'participant_count', false );

      $inner_join_mod = lib::create( 'database\modifier' );
      $inner_join_mod->group( 'source_id' );
      $inner_join_mod->where( 'source_id', '!=', NULL );

      // restrict to participants in this application
      if( $db_application->release_based )
      {
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where( 'participant.id', '=', 'application_has_participant.participant_id', false );
        $sub_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
        $sub_mod->where( 'application_has_participant.datetime', '!=', NULL );
        $inner_join_mod->join_modifier( 'application_has_participant', $sub_mod );
      }

      // restrict by site
      $db_restrict_site = $this->get_restricted_site();
      if( !is_null( $db_restrict_site ) )
      {
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where( 'participant.id', '=', 'participant_site.participant_id', false );
        $sub_mod->where( 'participant_site.application_id', '=', $db_application->id );
        $sub_mod->where( 'participant_site.site_id', '=', $db_restrict_site->id );
        $inner_join_mod->join_modifier( 'participant_site', $sub_mod );
      }

      // now create the outer join
      $outer_join_sel = lib::create( 'database\select' );
      $outer_join_sel->from( 'source' );
      $outer_join_sel->add_column( 'id', 'source_id' );
      $outer_join_sel->add_column(
        'IF( source_id IS NOT NULL, participant_count, 0 )', 'participant_count', false );

      $outer_join_mod = lib::create( 'database\modifier' );
      $outer_join_mod->left_join(
        sprintf( '( %s %s ) AS inner_join', $inner_join_sel->get_sql(), $inner_join_mod->get_sql() ),
        'source.id',
        'inner_join.source_id' );

      // now join to our main modifier
      $modifier->left_join(
        sprintf( '( %s %s ) AS outer_join', $outer_join_sel->get_sql(), $outer_join_mod->get_sql() ),
        'source.id',
        'outer_join.source_id' );
      $select->add_column( 'participant_count', 'participant_count', false );
    }
  }
}
