<?php
/**
 * export_file.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * export_file: record
 */
class export_file extends record
{
  /**
   * Returns where the export file is saved on the file system
   * 
   * @return string
   * @access public
   */
  public function get_filename()
  {
    return sprintf( '%s/export_%d.csv', EXPORT_PATH, $this->id );
  }

  /**
   * TODO: document
   */
  public function generate()
  {
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to generate export file record with no primary key.' );
      return;
    }

    $participant_class_name = lib::get_class_name( 'database\participant' );
    $util_class_name = lib::get_class_name( 'util' );

    $setting_manager = lib::create( 'business\setting_manager' );
    $db_export = $this->get_export();
    $db_application = lib::create( 'business\session' )->get_application();

    // set the export time limit to the report time limit
    set_time_limit( $setting_manager->get_setting( 'report', 'time_limit' ) );

    try
    {
      // mark the export_file stage/progress
      $this->stage = 'reading data';
      $this->progress = 0.0;
      $this->save();

      // build the select and modifier records for the participant select below
      $select = lib::create( 'database\select' );
      $modifier = lib::create( 'database\modifier' );

      // always restrict to this application's participants, and order by uid
      if( $db_application->release_based )
      {
        $sub_mod = lib::create( 'database\modifier' );
        $sub_mod->where( 'participant.id', '=', 'application_has_participant.participant_id', false );
        $sub_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
        $sub_mod->where( 'application_has_participant.datetime', '!=', NULL );
        $modifier->join_modifier( 'application_has_participant', $sub_mod );
      }
      $modifier->order( 'participant.uid' );

      // apply the export columns to the select and modifier
      $export_column_mod = lib::create( 'database\modifier' );
      $export_column_mod->order( 'rank' );
      foreach( $db_export->get_export_column_object_list( $export_column_mod ) as $db_export_column )
      {
        $db_export_column->apply_select( $select );
        $db_export_column->apply_modifier( $modifier );
      }

      // apply the export restrictions to the modifier
      $export_restriction_mod = lib::create( 'database\modifier' );
      $export_restriction_mod->order( 'rank' );
      foreach( $db_export->get_export_restriction_object_list( $export_restriction_mod )
               as $db_export_restriction )
        $db_export_restriction->apply_modifier( $modifier );

      // make sure the export_file hasn't been deleted
      try { $db_export_file = lib::create( 'database\export_file', $this->id ); }
      catch( \cenozo\exception\runtime $e ) { return; }

      // mark the export_file stage/progress
      $this->stage = 'writing data';
      $this->progress = 0.0;
      $this->save();

      // query the database and get the results as csv data
      $data = $util_class_name::get_data_as_csv(
        $participant_class_name::select( $select, $modifier ),
        $this->get_user()
      );

      // make sure the export_file hasn't been deleted
      try { $db_test_export_file = lib::create( 'database\export_file', $this->id ); }
      catch( \cenozo\exception\runtime $e ) { return; }

      // mark the export_file stage/progress
      $this->stage = 'writing data';
      $this->progress = 1.0;
      $this->save();

      // write the data to a file
      $result = file_put_contents( $this->get_filename(), $data, LOCK_EX );
      if( false === $result )
      {
        $this->stage = 'failed';
      }
      else
      {
        $this->stage = 'completed';
        $this->elapsed = $util_class_name::get_elapsed_time();
        $this->progress = 1.0;
        $this->size = $result;
      }
      $this->save();

    }
    catch( \Exception $e )
    {
      $this->stage = 'failed';
      $this->save();

      throw lib::create( 'exception\runtime',
        sprintf( 'Failed to create file for %s export id %d.', $db_export->title, $this->id ),
        __METHOD__, $e );
    }
  }
}
