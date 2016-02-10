<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\language;
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

    // if there is a parent then only show the active languages
    if( $this->get_parent_subject() ) $modifier->where( 'language.active', '=', true );

    // add the total number of participants
    if( $select->has_column( 'participant_count' ) )
    {
      // to accomplish this we need to create two sub-joins, so start by creating the inner join
      $inner_join_sel = lib::create( 'database\select' );
      $inner_join_sel->from( 'participant' );
      $inner_join_sel->add_column( 'language_id' );
      $inner_join_sel->add_column( 'COUNT(*)', 'participant_count', false );

      $inner_join_mod = lib::create( 'database\modifier' );
      $inner_join_mod->group( 'language_id' );
      $inner_join_mod->where( 'language_id', '!=', NULL );

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
      $outer_join_sel->from( 'language' );
      $outer_join_sel->add_column( 'id', 'language_id' );
      $outer_join_sel->add_column(
        'IF( language_id IS NOT NULL, participant_count, 0 )', 'participant_count', false );

      $outer_join_mod = lib::create( 'database\modifier' );
      $outer_join_mod->left_join(
        sprintf( '( %s %s ) AS inner_join', $inner_join_sel->get_sql(), $inner_join_mod->get_sql() ),
        'language.id',
        'inner_join.language_id' );

      // now join to our main modifier
      $modifier->left_join(
        sprintf( '( %s %s ) AS outer_join', $outer_join_sel->get_sql(), $outer_join_mod->get_sql() ),
        'language.id',
        'outer_join.language_id' );
      $select->add_column( 'participant_count', 'participant_count', false );
    }

    // add the total number of users
    if( $select->has_column( 'user_count' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'user_has_language' );
      $join_sel->add_column( 'language_id' );
      $join_sel->add_column( 'COUNT( DISTINCT user_has_language.user_id )', 'user_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->group( 'language_id' );

      // restrict to users who have access to this application
      $sub_mod = lib::create( 'database\modifier' );
      $join_mod->join( 'access', 'user_has_language.user_id', 'access.user_id' );
      $join_mod->join( 'application_has_site', 'access.site_id', 'application_has_site.site_id' );
      $join_mod->where( 'application_has_site.application_id', '=', $db_application->id );

      // restrict to users who have access to this site (for some roles)
      if( !is_null( $db_restrict_site ) )
        $join_mod->where( 'application_has_site.site_id', '=', $db_restrict_site->id );

      $modifier->left_join(
        sprintf( '( %s %s ) AS language_join_user', $join_sel->get_sql(), $join_mod->get_sql() ),
        'language.id',
        'language_join_user.language_id' );
      $select->add_column( 'IFNULL( user_count, 0 )', 'user_count', false );
    }
  }
}
