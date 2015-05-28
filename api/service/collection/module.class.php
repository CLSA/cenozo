<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\collection;
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
    $db_application = $session->get_application();
    $db_site = $session->get_site();
    $db_role = $session->get_role();

    // add the total number of participants
    if( $select->has_column( 'participant_count' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'collection_has_participant' );
      $join_sel->add_column( 'collection_id' );
      $join_sel->add_column( 'COUNT(*)', 'participant_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->group( 'collection_id' );

      // restrict to participants in this application
      if( $db_application->release_based )
      {
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where( 'collection_has_participant.participant_id', '=',
                         'application_has_participant.participant_id', false );
        $sub_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
        $join_mod->join_modifier( 'application_has_participant', $sub_mod );
        $join_mod->where( 'application_has_participant.datetime', '!=', NULL );
      }

      // restrict to participants in this site (for some roles)
      if( !$db_role->all_sites )
      {
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where( 'collection_has_participant.participant_id', '=',
                         'participant_site.participant_id', false );
        $sub_mod->where( 'participant_site.application_id', '=', $db_application->id );

        $join_mod->join_modifier( 'participant_site', $sub_mod );
        $join_mod->where( 'participant_site.site_id', '=', $db_site->id );
      }

      $modifier->left_join(
        sprintf( '( %s %s ) AS collection_join_participant', $join_sel->get_sql(), $join_mod->get_sql() ),
        'collection.id',
        'collection_join_participant.collection_id' );
      $select->add_column( 'IFNULL( participant_count, 0 )', 'participant_count', false );
    }

    // add the total number of users
    if( $select->has_column( 'user_count' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'user_has_collection' );
      $join_sel->add_column( 'collection_id' );
      $join_sel->add_column( 'COUNT( DISTINCT user_has_collection.user_id )', 'user_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->group( 'collection_id' );

      // restrict to users who have access to this application
      $sub_mod = lib::create( 'database\modifier' );
      $join_mod->join( 'access', 'user_has_collection.user_id', 'access.user_id' );
      $join_mod->join( 'site', 'access.site_id', 'site.id' );
      $join_mod->where( 'site.application_id', '=', $db_application->id );

      // restrict to users who have access to this site (for some roles)
      if( !$db_role->all_sites ) $join_mod->where( 'site.id', '=', $db_site->id );

      $modifier->left_join(
        sprintf( '( %s %s ) AS collection_join_user', $join_sel->get_sql(), $join_mod->get_sql() ),
        'collection.id',
        'collection_join_user.collection_id' );
      $select->add_column( 'IFNULL( user_count, 0 )', 'user_count', false );
    }
  }
}
