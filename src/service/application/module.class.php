<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\application;
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

    // add the total number of participants
    if( $select->has_column( 'participant_count' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'application' );
      $join_sel->add_column( 'id', 'application_id' );
      $join_sel->add_column(
        'IF( application.release_based, COUNT(*), ( SELECT COUNT(*) FROM participant ) )',
        'participant_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->left_join( 'application_has_participant',
        'application.id', 'application_has_participant.application_id' );
      $join_mod->where( 'application.release_based', '=', false );
      $join_mod->or_where( 'application_has_participant.datetime', '!=', NULL );
      $join_mod->group( 'application.id' );

      $modifier->left_join(
        sprintf( '( %s %s ) AS application_join_participant', $join_sel->get_sql(), $join_mod->get_sql() ),
        'application.id',
        'application_join_participant.application_id' );
      $select->add_column( 'participant_count', 'participant_count', false );
    }

    // add the total number of sites
    if( $select->has_column( 'site_count' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'application' );
      $join_sel->add_column( 'id', 'application_id' );
      $join_sel->add_column( 'IF( application_has_site.site_id IS NOT NULL, COUNT(*), 0 )', 'site_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->left_join( 'application_has_site', 'application.id', 'application_has_site.application_id' );
      $join_mod->group( 'application.id' );

      $modifier->left_join(
        sprintf( '( %s %s ) AS application_join_site', $join_sel->get_sql(), $join_mod->get_sql() ),
        'application.id',
        'application_join_site.application_id' );
      $select->add_column( 'IFNULL( site_count, 0 )', 'site_count', false );
    }

    // add the total number of users
    if( $select->has_column( 'user_count' ) )
    {
      $inner_join_sel = lib::create( 'database\select' );
      $inner_join_sel->from( 'access' );
      $inner_join_sel->add_column( 'application_id' );
      $inner_join_sel->add_column( 'COUNT( DISTINCT user_id )', 'user_count', false );

      $outer_join_sel = lib::create( 'database\select' );
      $outer_join_sel->from( 'application' );
      $outer_join_sel->add_column( 'id', 'application_id' );
      $outer_join_sel->add_column( 'IF( application_id IS NOT NULL, user_count, 0 )', 'user_count', false );

      $outer_join_mod = lib::create( 'database\modifier' );
      $outer_join_mod->left_join(
        sprintf( '( %s %s ) AS inner_join', $inner_join_sel->get_sql(), $inner_join_mod->get_sql() ),
        'application.id',
        'inner_join.application_id' );

      $modifier->left_join(
        sprintf( '( %s %s ) AS outer_join', $outer_join_sel->get_sql(), $outer_join_mod->get_sql() ),
        'application.id',
        'outer_join.application_id' );
      $select->add_column( 'IFNULL( user_count, 0 )', 'user_count', false );
    }
  }
}
