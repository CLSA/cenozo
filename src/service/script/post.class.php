<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\script;
use cenozo\lib, cenozo\log;

class post extends \cenozo\service\post
{
  /**
   * Extends parent method
   */
  protected function validate()
  {
    parent::validate();

    if( 300 > $this->status->get_code() )
    {
      // We must check for duplicate names here, otherwise an exception will be thrown when
      // creating the associated events in the setup() method
      $script_class_name = lib::get_class_name( 'database\script' );
      if( !is_null( $script_class_name::get_unique_record( 'name', $this->get_file_as_array()['name'] ) ) )
      {
        $this->set_data( array( 'name' ) );
        $this->status->set_code( 409 );
      }
    }
  }

  /**
   * Extends parent method
   */
  protected function setup()
  {
    parent::setup();

    $db_script = $this->get_leaf_record();

    // create a tracking event types for the new non-repeating scripts
    if( false == $db_script->repeated )
    {
      $db_started_event_type = lib::create( 'database\event_type' );
      $db_started_event_type->name = sprintf( 'started (%s)', $db_script->name );
      $db_started_event_type->description =
        sprintf( 'Started the "%s" script.', $db_script->name );
      $db_started_event_type->save();
      $db_script->started_event_type_id = $db_started_event_type->id;

      $db_finished_event_type = lib::create( 'database\event_type' );
      $db_finished_event_type->name = sprintf( 'finished (%s)', $db_script->name );
      $db_finished_event_type->record_address = true;
      $db_finished_event_type->description =
        sprintf( 'Started the "%s" script.', $db_script->name );
      $db_finished_event_type->save();
      $db_script->finished_event_type_id = $db_finished_event_type->id;
    }
  }

  /**
   * Extends parent method
   */
  protected function finish()
  {
    parent::finish();

    // add this script to the current application
    lib::create( 'business\session' )->get_application()->add_script( $this->get_leaf_record()->id );
  }
}
