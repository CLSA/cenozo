<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\consent_type;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\site_restricted_module
{
  /**
   * Extend parent constructor
   */
  public function __construct( $index, $service )
  {
    // enable the role_has feature
    parent::__construct( $index, $service, true );
  }

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $db_application = lib::create( 'business\session' )->get_application();
    $db_restrict_site = $this->get_restricted_site();

    // add the total number of accepts
    if( $select->has_column( 'accept_count' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'consent' );
      $join_sel->add_column( 'consent_type_id' );
      $join_sel->add_column( 'COUNT(*)', 'accept_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'accept', '=', true );
      $join_mod->group( 'consent_type_id' );

      // restrict to participants in this application
      if( $db_application->release_based )
      {
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where( 'consent.participant_id', '=', 'application_has_participant.participant_id', false );
        $sub_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
        $sub_mod->where( 'application_has_participant.datetime', '!=', NULL );
        $join_mod->join_modifier( 'application_has_participant', $sub_mod );
      }

      // restrict by site
      if( !is_null( $db_restrict_site ) )
      {
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where( 'consent.participant_id', '=', 'participant_site.participant_id', false );
        $sub_mod->where( 'participant_site.application_id', '=', $db_application->id );
        $sub_mod->where( 'participant_site.site_id', '=', $db_restrict_site->id );
        $join_mod->join_modifier( 'participant_site', $sub_mod );
      }

      $modifier->left_join(
        sprintf( '( %s %s ) AS consent_type_join_accept', $join_sel->get_sql(), $join_mod->get_sql() ),
        'consent_type.id',
        'consent_type_join_accept.consent_type_id' );
      $select->add_column( 'IFNULL( accept_count, 0 )', 'accept_count', false );
    }

    // add the total number of denys
    if( $select->has_column( 'deny_count' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'consent' );
      $join_sel->add_column( 'consent_type_id' );
      $join_sel->add_column( 'COUNT(*)', 'deny_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'accept', '=', false );
      $join_mod->group( 'consent_type_id' );

      // restrict to participants in this application
      if( $db_application->release_based )
      {
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where( 'consent.participant_id', '=', 'application_has_participant.participant_id', false );
        $sub_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
        $sub_mod->where( 'application_has_participant.datetime', '!=', NULL );
        $join_mod->join_modifier( 'application_has_participant', $sub_mod );
      }

      // restrict to participants in this site
      if( !is_null( $db_restrict_site ) )
      {
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where( 'consent.participant_id', '=', 'participant_site.participant_id', false );
        $sub_mod->where( 'participant_site.application_id', '=', $db_application->id );
        $sub_mod->where( 'participant_site.site_id', '=', $db_restrict_site->id );
        $join_mod->join_modifier( 'participant_site', $sub_mod );
      }

      $modifier->left_join(
        sprintf( '( %s %s ) AS consent_type_join_deny', $join_sel->get_sql(), $join_mod->get_sql() ),
        'consent_type.id',
        'consent_type_join_deny.consent_type_id' );
      $select->add_column( 'IFNULL( deny_count, 0 )', 'deny_count', false );
    }
  }
}
