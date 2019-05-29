<?php
/**
 * proxy.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\business\report;
use cenozo\lib, cenozo\log;

/**
 * Contact report
 */
class proxy extends \cenozo\business\report\base_report
{
  /**
   * Build the report
   * @access protected
   */
  protected function build()
  {
    $participant_class_name = lib::get_class_name( 'database\participant' );

    // create a list of the most recent "reminder" event for all participants
    $participant_sel = lib::create( 'database\select' );
    $participant_sel->from( 'participant' );
    $participant_sel->add_column( 'id' );

    $participant_mod = lib::create( 'database\modifier' );
    $participant_mod->where( 'exclusion_id', '=', NULL );

    $participant_class_name::db()->execute( 'DROP TABLE IF EXISTS reminder_event' );
    $participant_class_name::db()->execute(
      'CREATE TABLE reminder_event ( '.
      '  participant_id INT(10) UNSIGNED NOT NULL,'.
      '  datetime DATETIME NULL DEFAULT NULL,'.
      '  KEY dk_participant_id (participant_id)'.
      ')'
    );
    $participant_class_name::db()->execute( sprintf(
      'INSERT INTO reminder_event ( participant_id ) %s',
      $participant_sel->get_sql(),
      $participant_mod->get_sql()
    ) );

    // now get all of the most recent event datetimes
    $reminder_sel = lib::create( 'database\select' );
    $reminder_sel->from( 'event' );
    $reminder_sel->add_column( 'participant_id' );
    $reminder_sel->add_column( 'MAX( datetime )', 'datetime', false );

    $reminder_mod = lib::create( 'database\modifier' );
    $reminder_mod->join( 'event_type', 'event_type.id', 'event.event_type_id' );
    $reminder_mod->where( 'event_type.name', 'LIKE', '%mail%reminder%' );
    $reminder_mod->group( 'participant_id' );

    $participant_class_name::db()->execute( 'DROP TABLE IF EXISTS last_event' );
    $participant_class_name::db()->execute( sprintf(
      'CREATE TEMPORARY TABLE last_event %s %s',
      $reminder_sel->get_sql(),
      $reminder_mod->get_sql()
    ) );
    $participant_class_name::db()->execute( 'ALTER TABLE last_event ADD INDEX dk_participant_id (participant_id)' );

    $participant_class_name::db()->execute(
      'UPDATE reminder_event '.
      'JOIN last_event USING( participant_id ) '.
      'SET reminder_event.datetime = last_event.datetime'
    );
    $participant_class_name::db()->execute( 'DROP TABLE IF EXISTS last_event' );

    // now prepare the report
    $select = lib::create( 'database\select' );
    $select->from( 'participant' );
    $select->add_column( 'uid', 'UID' );
    $select->add_column( 'cohort.name', 'Cohort', false );
    $select->add_column(
      $participant_class_name::get_status_column_sql(),
      'Status',
      false
    );
    $select->add_column( 'TIMESTAMPDIFF( YEAR, date_of_birth, CURDATE() )', 'Age', false );
    $select->add_column( 'SUM( CASE WHEN alternate.proxy THEN 1 ELSE 0 END )', 'DM Total', false );
    $select->add_column( 'SUM( CASE WHEN alternate.informant THEN 1 ELSE 0 END )', 'IP Total', false );
    $select->add_column(
      'IF( '.
      '  date_of_birth IS NULL OR reminder_event.datetime IS NULL, '.
      '  "?", '.
      '  IF( TIMESTAMPDIFF( YEAR, date_of_birth, reminder_event.datetime ) >= 70, "Y", "N" ) '.
      ')',
      '70+',
      false
    );

    $modifier = lib::create( 'database\modifier' );
    $modifier->left_join( 'exclusion', 'participant.exclusion_id', 'exclusion.id' );
    $modifier->join( 'cohort', 'participant.cohort_id', 'cohort.id' );
    $modifier->join( 'participant_last_hold', 'participant.id', 'participant_last_hold.participant_id' );
    $modifier->left_join( 'hold', 'participant_last_hold.hold_id', 'hold.id' );
    $modifier->left_join( 'hold_type', 'hold.hold_type_id', 'hold_type.id' );
    $modifier->join( 'participant_last_proxy', 'participant.id', 'participant_last_proxy.participant_id' );
    $modifier->left_join( 'proxy', 'participant_last_proxy.proxy_id', 'proxy.id' );
    $modifier->left_join( 'proxy_type', 'proxy.proxy_type_id', 'proxy_type.id' );
    $modifier->join( 'participant_last_trace', 'participant.id', 'participant_last_trace.participant_id' );
    $modifier->left_join( 'trace', 'participant_last_trace.trace_id', 'trace.id' );
    $modifier->left_join( 'trace_type', 'trace.trace_type_id', 'trace_type.id' );
    $modifier->left_join( 'alternate', 'participant.id', 'alternate.participant_id' );
    $modifier->where( 'participant.exclusion_id', '=', NULL );
    $modifier->group( 'participant.id' );
    $modifier->order( 'uid' );
    
    // join to the most recent "reminder" event (temp table created above)
    $modifier->join( 'reminder_event', 'participant.id', 'reminder_event.participant_id' );

    $this->add_table_from_select( NULL, $participant_class_name::select( $select, $modifier ) );

    // clean up
    $participant_class_name::db()->execute( 'DROP TABLE IF EXISTS reminder_event' );
  }
}
