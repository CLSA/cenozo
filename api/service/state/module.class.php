<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\state;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\module
{
  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $session = lib::create( 'business\session' );
    $db_role = $session->get_role();
    $db_application = $session->get_application();

    // add the access column (wether the role has access)
    if( $select->has_column( 'access' ) )
    {
      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'state.id', '=', 'role_has_state.state_id', false );
      $join_mod->where( 'role_has_state.role_id', '=', $db_role->id );
      $modifier->join_modifier( 'role_has_state', $join_mod, 'left' );
      $select->add_column( 'role_has_state.state_id IS NOT NULL', 'access', false, 'boolean' );
    }

    // add the total number of participants
    if( $select->has_column( 'participant_count' ) )
    {
      // to accomplish this we need to create two sub-joins, so start by creating the inner join
      $inner_join_sel = lib::create( 'database\select' );
      $inner_join_sel->from( 'participant' );
      $inner_join_sel->add_column( 'state_id' );
      $inner_join_sel->add_column( 'COUNT(*)', 'participant_count', false );

      $inner_join_mod = lib::create( 'database\modifier' );
      $inner_join_mod->group( 'state_id' );
      $inner_join_mod->where( 'state_id', '!=', NULL );

      // restrict to participants in this application
      if( $db_application->release_based )
      {
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where( 'participant.id', '=', 'application_has_participant.participant_id', false );
        $sub_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
        $sub_mod->where( 'application_has_participant.datetime', '!=', NULL );
        $inner_join_mod->join_modifier( 'application_has_participant', $sub_mod );
      }

      // restrict to participants in this site (for some roles)
      if( !$db_role->all_sites )
      {
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where( 'participant.id', '=', 'participant_site.participant_id', false );
        $sub_mod->where( 'participant_site.application_id', '=', $db_application->id );
        $sub_mod->where( 'participant_site.site_id', '=', $session->get_site()->id );
        $inner_join_mod->join_modifier( 'participant_site', $sub_mod );
      }

      // now create the outer join
      $outer_join_sel = lib::create( 'database\select' );
      $outer_join_sel->from( 'state' );
      $outer_join_sel->add_column( 'id', 'state_id' );
      $outer_join_sel->add_column(
        'IF( state_id IS NOT NULL, participant_count, 0 )', 'participant_count', false );

      $outer_join_mod = lib::create( 'database\modifier' );
      $outer_join_mod->left_join(
        sprintf( '( %s %s ) AS inner_join', $inner_join_sel->get_sql(), $inner_join_mod->get_sql() ),
        'state.id',
        'inner_join.state_id' );

      // now join to our main modifier
      $modifier->left_join(
        sprintf( '( %s %s ) AS outer_join', $outer_join_sel->get_sql(), $outer_join_mod->get_sql() ),
        'state.id',
        'outer_join.state_id' );
      $select->add_column( 'participant_count', 'participant_count', false );
    }

    // add the total number of roles
    if( $select->has_column( 'role_count' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'role_has_state' );
      $join_sel->add_column( 'state_id' );
      $join_sel->add_column( 'COUNT(*)', 'role_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->group( 'state_id' );

      // restrict to roles belonging to this application
      $sub_mod = lib::create( 'database\modifier' );
      $join_mod->join( 'application_has_role', 'role_has_state.role_id', 'application_has_role.role_id' );
      $join_mod->where( 'application_has_role.application_id', '=', $db_application->id );

      $modifier->left_join(
        sprintf( '( %s %s ) AS state_join_role', $join_sel->get_sql(), $join_mod->get_sql() ),
        'state.id',
        'state_join_role.state_id' );
      $select->add_column( 'IFNULL( role_count, 0 )', 'role_count', false );
    }
  }
}
