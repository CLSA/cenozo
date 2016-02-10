<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\script;
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

    $participant_class_name = lib::get_class_name( 'database\participant' );
    $script_class_name = lib::get_class_name( 'database\script' );
    $surveys_class_name = lib::get_class_name( 'database\limesurvey\surveys' );

    // join to limesurvey tables to get the survey name
    if( $select->has_column( 'survey_title' ) )
    {
      $survey_table_array = array();
      foreach( $surveys_class_name::get_titles() as $sid => $title )
        $survey_table_array[] = sprintf( 'SELECT %s sid, "%s" title', $sid, $title );
      $survey_table = sprintf( '( %s ) AS survey', implode( $survey_table_array, ' UNION ' ) );
      $modifier->left_join( $survey_table, 'script.sid', 'survey.sid' );
      $select->add_table_column( 'survey', 'title', 'survey_title' );
    }

    $db_participant = NULL;
    $participant_id = $this->get_argument( 'participant_id', NULL );
    $uid = $this->get_argument( 'uid', NULL );
    if( !is_null( $participant_id ) ) $db_participant = lib::create( 'database\participant', $participant_id );
    else if( !is_null( $uid ) ) $db_participant = $participant_class_name::get_unique_record( 'uid', $uid );

    // if a participant is specified then update the started/finished events
    if( !is_null( $db_participant ) ) $script_class_name::add_all_event_types( $db_participant );

    if( $select->has_table_columns( 'started_event' ) || $select->has_table_columns( 'finished_event' ) )
    {
      if( is_null( $db_participant ) )
      {
        log::warning(
          'Script service requested participant-based information without providing uid or participant_id.' );
      }
      else
      {
        if( $select->has_table_columns( 'started_event' ) )
        {
          $join_mod = lib::create( 'database\modifier' );
          $join_mod->where( 'script.started_event_type_id', '=', 'started_last_event.event_type_id', false );
          $join_mod->where( 'started_last_event.participant_id', '=', $db_participant->id );
          $modifier->join_modifier( 'participant_last_event', $join_mod, 'left', 'started_last_event' );
          $modifier->left_join(
            'event', 'started_last_event.event_id', 'started_event.id', 'started_event' );
        }

        if( $select->has_table_columns( 'finished_event' ) )
        {
          $join_mod = lib::create( 'database\modifier' );
          $join_mod->where( 'script.finished_event_type_id', '=', 'finished_last_event.event_type_id', false );
          $join_mod->where( 'finished_last_event.participant_id', '=', $db_participant->id );
          $modifier->join_modifier( 'participant_last_event', $join_mod, 'left', 'finished_last_event' );
          $modifier->left_join(
            'event', 'finished_last_event.event_id', 'finished_event.id', 'finished_event' );
        }
      }
    }

    if( $select->has_column( 'url' ) )
      $select->add_column( sprintf( 'CONCAT( "%s/index.php?sid=", script.sid )', LIMESURVEY_URL ), 'url', false );
  }
}
