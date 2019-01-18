<?php
/**
 * get.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\script\token;
use cenozo\lib, cenozo\log;

class get extends \cenozo\service\get
{
  /**
   * Override parent method
   */
  public function get_record_class_name( $index, $relative = false )
  {
    $subject = $this->get_subject( $index );
    if( 'token' != $subject ) return parent::get_record_class_name( $index, $relative );

    $class = 'database\limesurvey\tokens'; // limesurvey pluralizes table names
    return $relative ? $class : lib::get_class_name( $class );
  }

  /**
   * Override parent method
   */
  protected function create_resource( $index )
  {
    $record = NULL;

    if( 'token' == $this->get_subject( $index ) )
    {
      $supporting_script_check_class_name = lib::get_class_name( 'database\supporting_script_check' );
      $tokens_class_name = $this->get_record_class_name( $index );

      // make sure to set the token class name SID
      $db_script = $this->get_parent_record();
      $old_sid = $tokens_class_name::get_sid();
      $tokens_class_name::set_sid( $db_script->sid );

      // handle special case of token resource value being uid=<uid>
      $resource_value = $this->get_resource_value( $index );
      $record = $tokens_class_name::get_record_from_identifier( $resource_value );

      // delete incomplete supporting scripts if they have expired
      if( !is_null( $record ) && 'N' == $record->completed )
      {
        $db_participant = $record->get_participant();
        $db_supporting_script_check = $supporting_script_check_class_name::get_unique_record(
          array( 'participant_id', 'script_id' ),
          array( $db_participant->id, $db_script->id )
        );

        // Remove the survey(s) if there is an expired check
        if( !is_null( $db_supporting_script_check ) && $db_supporting_script_check->is_expired() )
        {
          foreach( $record->get_survey_list() as $db_survey ) $db_survey->delete();
          $record->delete();
          $record = NULL;

          // also remove the script check if there is one
          if( !is_null( $db_supporting_script_check ) ) $db_supporting_script_check->delete();
        }
      }

      $tokens_class_name::set_sid( $old_sid );
    }
    else
    {
      $record = parent::create_resource( $index );
    }

    return $record;
  }

  /** 
   * Override parent method
   */
  protected function finish()
  {
    parent::finish();

    $participant_class_name = lib::get_class_name( 'database\participant' );
    $supporting_script_check_class_name = lib::get_class_name( 'database\supporting_script_check' );

    // if this is a completed supporting script token then process it
    $db_script = $this->get_resource( 0 );
    $db_tokens = $this->get_resource( 1 );
    if( $db_script->supporting )
    {
      $db_participant = $db_tokens->get_participant();
      $db_supporting_script_check = $supporting_script_check_class_name::get_unique_record(
        array( 'participant_id', 'script_id' ),
        array( $db_participant->id, $db_script->id )
      );
      if( !is_null( $db_supporting_script_check ) ) $db_supporting_script_check->process();
    }
  }
}
