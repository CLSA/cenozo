<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\stratum;
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
    $db_restrict_site = $this->get_restricted_site();

    // add the total number of participants
    if( $select->has_column( 'participant_count' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'stratum' );
      $join_sel->add_column( 'id', 'stratum_id' );
      $join_sel->add_column(
        'IF( stratum_has_participant.participant_id IS NOT NULL, COUNT(*), 0 )',
        'participant_count', false
      );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->left_join( 'stratum_has_participant', 'stratum.id', 'stratum_has_participant.stratum_id' );
      $join_mod->group( 'stratum.id' );

      // restrict to participants in this application
      if( $db_application->release_based )
      {
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where( 'stratum_has_participant.participant_id', '=', 'application_has_participant.participant_id', false );
        $sub_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
        $sub_mod->where( 'application_has_participant.datetime', '!=', NULL );
        $join_mod->join_modifier( 'application_has_participant', $sub_mod );
      }

      // restrict by site
      if( !is_null( $db_restrict_site ) )
      {
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where( 'stratum_has_participant.participant_id', '=', 'participant_site.participant_id', false );
        $sub_mod->where( 'participant_site.application_id', '=', $db_application->id );
        $sub_mod->where( 'participant_site.site_id', '=', $db_restrict_site->id );
        $join_mod->join_modifier( 'participant_site', $sub_mod );
      }

      $modifier->left_join(
        sprintf( '( %s %s ) AS stratum_join_participant', $join_sel->get_sql(), $join_mod->get_sql() ),
        'stratum.id',
        'stratum_join_participant.stratum_id'
      );
      $select->add_column( 'IFNULL( participant_count, 0 )', 'participant_count', false );
    }

    // add the total number of participants
    if( $select->has_column( 'eligible_count' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'stratum' );
      $join_sel->add_column( 'id', 'stratum_id' );
      $join_sel->add_column(
        'IF( stratum_has_participant.participant_id IS NOT NULL, COUNT(*), 0 )',
        'eligible_count', false
      );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->left_join( 'stratum_has_participant', 'stratum.id', 'stratum_has_participant.stratum_id' );
      $join_mod->group( 'stratum.id' );

      // restrict to participants belonging to the study
      $join_mod->join( 'study', 'stratum.study_id', 'study.id' );
      $study_join_mod = lib::create( 'database\modifier' );
      $study_join_mod->where( 'study.id', '=', 'study_has_participant.study_id', false );
      $study_join_mod->where(
        'stratum_has_participant.participant_id',
        '=',
        'study_has_participant.participant_id',
        false
      );
      $join_mod->join_modifier( 'study_has_participant', $study_join_mod );

      // restrict to participants in this application
      if( $db_application->release_based )
      {
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where(
          'stratum_has_participant.participant_id',
          '=',
          'application_has_participant.participant_id',
          false
        );
        $sub_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
        $sub_mod->where( 'application_has_participant.datetime', '!=', NULL );
        $join_mod->join_modifier( 'application_has_participant', $sub_mod );
      }

      // restrict by site
      if( !is_null( $db_restrict_site ) )
      {
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where( 'stratum_has_participant.participant_id', '=', 'participant_site.participant_id', false );
        $sub_mod->where( 'participant_site.application_id', '=', $db_application->id );
        $sub_mod->where( 'participant_site.site_id', '=', $db_restrict_site->id );
        $join_mod->join_modifier( 'participant_site', $sub_mod );
      }

      $modifier->left_join(
        sprintf( '( %s %s ) AS stratum_join_eligible', $join_sel->get_sql(), $join_mod->get_sql() ),
        'stratum.id',
        'stratum_join_eligible.stratum_id'
      );
      $select->add_column( 'IFNULL( eligible_count, 0 )', 'eligible_count', false );
    }

    // add the total number of participants who have refused for the parent study
    if( $select->has_column( 'refused_count' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'stratum' );
      $join_sel->add_column( 'id', 'stratum_id' );
      $join_sel->add_column( 'SUM( IF( consent.id IS NULL, 0, 1 ) )', 'refused_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->join( 'study', 'stratum.study_id', 'study.id' );
      $join_mod->left_join( 'stratum_has_participant', 'stratum.id', 'stratum_has_participant.stratum_id' );
      $sub_mod = lib::create( 'database\modifier' );
      $sub_mod->where( 'stratum_has_participant.participant_id', '=', 'participant_last_consent.participant_id', false );
      $sub_mod->where( 'participant_last_consent.consent_type_id', '=', 'study.consent_type_id', false );
      $join_mod->join_modifier( 'participant_last_consent', $sub_mod, 'left' );
      $sub_mod = lib::create( 'database\modifier' );
      $sub_mod->where( 'participant_last_consent.consent_id', '=', 'consent.id', false );
      $sub_mod->where( 'consent.accept', '=', false );
      $join_mod->join_modifier( 'consent', $sub_mod, 'left' );
      $join_mod->group( 'stratum.id' );

      // restrict to participants in this application
      if( $db_application->release_based )
      {
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where( 'stratum_has_participant.participant_id', '=', 'application_has_participant.participant_id', false );
        $sub_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
        $sub_mod->where( 'application_has_participant.datetime', '!=', NULL );
        $join_mod->join_modifier( 'application_has_participant', $sub_mod );
      }

      // restrict by site
      if( !is_null( $db_restrict_site ) )
      {
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where( 'stratum_has_participant.participant_id', '=', 'participant_site.participant_id', false );
        $sub_mod->where( 'participant_site.application_id', '=', $db_application->id );
        $sub_mod->where( 'participant_site.site_id', '=', $db_restrict_site->id );
        $join_mod->join_modifier( 'participant_site', $sub_mod );
      }

      $modifier->left_join(
        sprintf( '( %s %s ) AS stratum_join_refused', $join_sel->get_sql(), $join_mod->get_sql() ),
        'stratum.id',
        'stratum_join_refused.stratum_id'
      );
      $select->add_column( 'IFNULL( refused_count, 0 )', 'refused_count', false );
    }

    // add the total number of participants who have consented for the parent study
    if( $select->has_column( 'consented_count' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'stratum' );
      $join_sel->add_column( 'id', 'stratum_id' );
      $join_sel->add_column( 'SUM( IF( consent.id IS NULL, 0, 1 ) )', 'consented_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->join( 'study', 'stratum.study_id', 'study.id' );
      $join_mod->left_join( 'stratum_has_participant', 'stratum.id', 'stratum_has_participant.stratum_id' );
      $sub_mod = lib::create( 'database\modifier' );
      $sub_mod->where( 'stratum_has_participant.participant_id', '=', 'participant_last_consent.participant_id', false );
      $sub_mod->where( 'participant_last_consent.consent_type_id', '=', 'study.consent_type_id', false );
      $join_mod->join_modifier( 'participant_last_consent', $sub_mod, 'left' );
      $sub_mod = lib::create( 'database\modifier' );
      $sub_mod->where( 'participant_last_consent.consent_id', '=', 'consent.id', false );
      $sub_mod->where( 'consent.accept', '=', true );
      $join_mod->join_modifier( 'consent', $sub_mod, 'left' );
      $join_mod->group( 'stratum.id' );

      // restrict to participants in this application
      if( $db_application->release_based )
      {
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where( 'stratum_has_participant.participant_id', '=', 'application_has_participant.participant_id', false );
        $sub_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
        $sub_mod->where( 'application_has_participant.datetime', '!=', NULL );
        $join_mod->join_modifier( 'application_has_participant', $sub_mod );
      }

      // restrict by site
      if( !is_null( $db_restrict_site ) )
      {
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where( 'stratum_has_participant.participant_id', '=', 'participant_site.participant_id', false );
        $sub_mod->where( 'participant_site.application_id', '=', $db_application->id );
        $sub_mod->where( 'participant_site.site_id', '=', $db_restrict_site->id );
        $join_mod->join_modifier( 'participant_site', $sub_mod );
      }

      $modifier->left_join(
        sprintf( '( %s %s ) AS stratum_join_consented', $join_sel->get_sql(), $join_mod->get_sql() ),
        'stratum.id',
        'stratum_join_consented.stratum_id'
      );
      $select->add_column( 'IFNULL( consented_count, 0 )', 'consented_count', false );
    }

    // add the total number of participants who have completed for the parent study
    if( $select->has_column( 'completed_count' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'stratum' );
      $join_sel->add_column( 'id', 'stratum_id' );
      $join_sel->add_column( 'SUM( IF( event.id IS NULL, 0, 1 ) )', 'completed_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->join( 'study', 'stratum.study_id', 'study.id' );
      $join_mod->left_join( 'stratum_has_participant', 'stratum.id', 'stratum_has_participant.stratum_id' );
      $sub_mod = lib::create( 'database\modifier' );
      $sub_mod->where( 'stratum_has_participant.participant_id', '=', 'participant_last_event.participant_id', false );
      $sub_mod->where( 'participant_last_event.event_type_id', '=', 'study.completed_event_type_id', false );
      $join_mod->join_modifier( 'participant_last_event', $sub_mod, 'left' );
      $join_mod->left_join( 'event', 'participant_last_event.event_id', 'event.id' );
      $join_mod->group( 'stratum.id' );

      // restrict to participants in this application
      if( $db_application->release_based )
      {
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where( 'stratum_has_participant.participant_id', '=', 'application_has_participant.participant_id', false );
        $sub_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
        $sub_mod->where( 'application_has_participant.datetime', '!=', NULL );
        $join_mod->join_modifier( 'application_has_participant', $sub_mod );
      }

      // restrict by site
      if( !is_null( $db_restrict_site ) )
      {
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where( 'stratum_has_participant.participant_id', '=', 'participant_site.participant_id', false );
        $sub_mod->where( 'participant_site.application_id', '=', $db_application->id );
        $sub_mod->where( 'participant_site.site_id', '=', $db_restrict_site->id );
        $join_mod->join_modifier( 'participant_site', $sub_mod );
      }

      $modifier->left_join(
        sprintf( '( %s %s ) AS stratum_join_completed', $join_sel->get_sql(), $join_mod->get_sql() ),
        'stratum.id',
        'stratum_join_completed.stratum_id'
      );
      $select->add_column( 'IFNULL( completed_count, 0 )', 'completed_count', false );
    }
  }
}
