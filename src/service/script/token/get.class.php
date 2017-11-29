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
  protected function get_record_class_name( $index, $relative = false )
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
      $util_class_name = lib::get_class_name( 'util' );
      $participant_class_name = lib::get_class_name( 'database\participant' );
      $tokens_class_name = $this->get_record_class_name( $index );
      $setting_manager = lib::create( 'business\setting_manager' );

      // make sure to set the token class name SID
      $db_script = $this->get_parent_record();
      $old_sid = $tokens_class_name::get_sid();
      $tokens_class_name::set_sid( $db_script->sid );

      // handle special case of token resource value being uid=<uid>
      $resource_value = $this->get_resource_value( $index );
      $record = $tokens_class_name::get_record_from_identifier( $resource_value );

      // the withdraw script may be deleted if it is incomplete
      if( $db_script->is_withdraw_type() && !is_null( $record ) && 'N' == $record->completed )
      {
        $db_participant = $record->get_participant();

        $remove = false;
        if( is_null( $db_participant->check_withdraw ) )
        {
          // the script is incomplete and there is no check withdraw date, so remove it
          $remove = true;
        }
        else
        {
          // if the withdraw is older than the timeout value then remove it
          $timeout = $setting_manager->get_setting( 'general', 'withdraw_timeout' );
          $now = $util_class_name::get_datetime_object();
          $now->sub( new \DateInterval( sprintf( 'PT%dM', $timeout ) ) );
          $remove = $now > $db_participant->check_withdraw;
        }

        if( $remove )
        {
          foreach( $record->get_survey_list() as $db_survey ) $db_survey->delete();
          $record->delete();
          $record = NULL;
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

    // if this is a completed withdraw token then process it required
    $db_script = $this->get_resource( 0 );
    $db_tokens = $this->get_resource( 1 );
    if( $db_script->is_withdraw_type() )
    {
      $db_participant = $db_tokens->get_participant();
      if( !is_null( $db_participant->check_withdraw ) )
      {
        $survey_manager = lib::create( 'business\survey_manager' );
        $survey_manager->process_withdraw( $db_participant );
      }
    }
  }
}
