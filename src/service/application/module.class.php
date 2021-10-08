<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
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

    $modifier->join( 'country', 'application.country_id', 'country.id' );
    $modifier->left_join( 'study_phase', 'application.study_phase_id', 'study_phase.id' );
    $modifier->left_join( 'study', 'study_phase.study_id', 'study.id' );

    // add the combined study-study_phase names
    if( $select->has_column( 'study_phase' ) )
      $select->add_column( 'IF( study.name IS NULL, NULL, CONCAT_WS( " ", study.name, study_phase.name ) )', 'study_phase', false );

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
    if( $select->has_column( 'site_count' ) ) $this->add_count_column( 'site_count', 'site', $select, $modifier );

    // include participant release details
    if( 'participant' == $this->get_parent_subject() )
    {
      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'application.id', '=', 'participant_site.application_id', false );
      $join_mod->where( 'participant_site.participant_id', '=', $this->get_parent_resource()->id );
      $modifier->join_modifier( 'participant_site', $join_mod );

      $select->add_table_column( 'participant_site', 'default_site_id' );
      $select->add_table_column( 'application_has_participant', 'preferred_site_id' );
      $select->add_table_column( 'application_has_participant', 'datetime' );

      if( $select->has_table_columns( 'default_site' ) )
        $modifier->left_join( 'site', 'default_site_id', 'default_site.id', 'default_site' );
      if( $select->has_table_columns( 'preferred_site' ) )
        $modifier->left_join( 'site', 'preferred_site_id', 'preferred_site.id', 'preferred_site' );
    }

    // include supplemental data
    if( !is_null( $this->get_resource() ) ) $select->add_table_column( 'country', 'name', 'formatted_country_id' );
  }
}
