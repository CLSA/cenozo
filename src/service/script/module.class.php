<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
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

    $application_class_name = lib::get_class_name( 'database\application' );
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $script_class_name = lib::get_class_name( 'database\script' );
    $surveys_class_name = lib::get_class_name( 'database\limesurvey\surveys' );

    $select->add_column(
      'IF( script.sid IS NOT NULL, "Limesurvey", IF( script.pine_qnaire_id IS NOT NULL, "Pine", NULL ) )',
      'application',
      false
    );

    // join to limesurvey and pine qnaire tables to get the qnaire name
    if( $select->has_column( 'qnaire_title' ) )
    {
      // link to limesurvey survey list
      $survey_table_array = array();
      foreach( $surveys_class_name::get_titles() as $sid => $title )
        $survey_table_array[] = sprintf( 'SELECT %s sid, "%s" title', $sid, $title );
      $survey_table = sprintf( '( %s ) AS survey', implode( $survey_table_array, ' UNION ' ) );
      $modifier->left_join( $survey_table, 'script.sid', 'survey.sid' );

      /*
      // link to pine qnaire list
      $cenozo_manager = lib::create( 'business\cenozo_manager', 'pine' );
      $qnaire_table_array = array();
      foreach( $cenozo_manager->get( 'qnaire?no_activity=1&select={"column":["id","name"]}' ) as $obj )
        $qnaire_table_array[] = sprintf( 'SELECT %s id, "%s" name', $obj->id, $obj->name );
      $qnaire_table = sprintf( '( %s ) AS pine_qnaire', implode( $qnaire_table_array, ' UNION ' ) );
      $modifier->left_join( $qnaire_table, 'script.pine_qnaire_id', 'pine_qnaire.id' );

      $select->add_column( 'IFNULL( survey.title, pine_qnaire.name )', 'qnaire_title', false );
      */
      $select->add_column( 'survey.title', 'qnaire_title', false );
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

    if( $select->has_column( 'access' ) )
    {
      // add whether the current application has access to this script
      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'script.id', '=', 'application_has_script.script_id', false );
      $join_mod->where( 'application_has_script.application_id', '=',
        lib::create( 'business\session' )->get_application()->id );
      $modifier->join_modifier( 'application_has_script', $join_mod, 'left' );
      $select->add_column( 'application_has_script.application_id IS NOT NULL', 'access', false );
    }

    if( $select->has_column( 'url' ) )
    {
      $db_pine_application = $application_class_name::get_unique_record( 'name', 'pine' );
      $select->add_column(
        sprintf(
          'IF( pine_qnaire_id IS NOT NULL, "%s/response/run/", CONCAT( "%s/index.php/", script.sid ) )',
          is_object( $db_pine_application ) ? $db_pine_application->url : '',
          LIMESURVEY_URL
        ),
        'url',
        false
      );
    }
  }
}
