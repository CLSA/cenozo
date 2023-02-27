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

    $util_class_name = lib::get_class_name( 'util' );
    $application_class_name = lib::get_class_name( 'database\application' );
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $script_class_name = lib::get_class_name( 'database\script' );
    $session = lib::create( 'business\session' );

    $select->add_column(
      'IF( script.pine_qnaire_id IS NOT NULL, "pine", "external" )',
      'application',
      false
    );

    $db_participant = NULL;
    $participant_id = $this->get_argument( 'participant_id', NULL );
    $uid = $this->get_argument( 'uid', NULL );
    if( !is_null( $participant_id ) ) $db_participant = lib::create( 'database\participant', $participant_id );
    else if( !is_null( $uid ) ) $db_participant = $participant_class_name::get_unique_record( 'uid', $uid );

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
      $join_mod->where( 'application_has_script.application_id', '=', $session->get_application()->id );
      $modifier->join_modifier( 'application_has_script', $join_mod, 'left' );
      $select->add_column( 'application_has_script.application_id IS NOT NULL', 'access', false );
    }

    if( $select->has_column( 'url' ) )
    {
      $db_pine_application = $session->get_pine_application();
      $select->add_column(
        sprintf(
          'IF( pine_qnaire_id IS NOT NULL, "%s/respondent/run/", NULL )',
          is_null( $db_pine_application ) ? '' : $db_pine_application->url
        ),
        'url',
        false
      );
    }
  }
}
