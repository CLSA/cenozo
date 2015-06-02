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
      $join_sel->add_column( 'COUNT(*)', 'participant_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->left_join( 'application_has_participant',
        'application.id', 'application_has_participant.application_id' );
      $join_mod->where( 'application_has_participant.participant_id', '=', NULL );
      $join_mod->or_where( 'application_has_participant.datetime', '!=', NULL );
      $join_mod->group( 'application_id' );

      $modifier->left_join(
        sprintf( '( %s %s ) AS application_join_participant', $join_sel->get_sql(), $join_mod->get_sql() ),
        'application.id',
        'application_join_participant.application_id' );
      $select->add_column( 'IF( application.release_based, '.
                               'IFNULL( participant_count, 0 ), '.
                               '( SELECT COUNT(*) FROM participant ) )',
                           'participant_count',
                           false );
    }

    // add the total number of sites
    if( $select->has_column( 'site_count' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'site' );
      $join_sel->add_column( 'application_id' );
      $join_sel->add_column( 'COUNT(*)', 'site_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->group( 'application_id' );

      $modifier->left_join(
        sprintf( '( %s %s ) AS application_join_site', $join_sel->get_sql(), $join_mod->get_sql() ),
        'application.id',
        'application_join_site.application_id' );
      $select->add_column( 'IFNULL( site_count, 0 )', 'site_count', false );
    }

    // add the total number of users
    if( $select->has_column( 'user_count' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'access' );
      $join_sel->add_table_column( 'site', 'application_id' );
      $join_sel->add_column( 'COUNT( DISTINCT user_id )', 'user_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->join( 'site', 'access.site_id', 'site.id' );
      $join_mod->group( 'site.application_id' );

      $modifier->left_join(
        sprintf( '( %s %s ) AS application_join_user', $join_sel->get_sql(), $join_mod->get_sql() ),
        'application.id',
        'application_join_user.application_id' );
      $select->add_column( 'IFNULL( user_count, 0 )', 'user_count', false );
    }
  }
}
