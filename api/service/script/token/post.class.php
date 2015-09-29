<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\script\token;
use cenozo\lib, cenozo\log;

class post extends \cenozo\service\post
{
  /**
   * Override parent method
   */
  protected function validate()
  {
    parent::validate();

    // must have a participant_id in the provided data
    $data = $this->get_file_as_array();
    if( 1 !== count( $data ) || !in_array( key( $data ), array( 'uid', 'participant_id' ) ) )
      $this->status->set_code( 400 );
  }

  /**
   * Override parent method
   */
  protected function setup()
  {
    parent::setup();

    // create the participant record
    $survey_manager = lib::create( 'business\survey_manager' );
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $data = $this->get_file_as_array();

    // populate the token
    $db_script = $this->get_parent_record();
    $db_participant = array_key_exists( 'uid', $data )
                    ? $participant_class_name::get_unique_record( 'uid', $data['uid'] )
                    : lib::create( 'database\participant', $data['participant_id'] );
    $db_tokens = $this->get_leaf_record();
    $survey_manager->populate_token( $db_script, $db_participant, $db_tokens );
  }

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
    if( 'token' == $this->get_subject( $index ) )
    {
      // make sure to set the token class name SID
      $db_script = $this->get_parent_record();
      $tokens_class_name = $this->get_record_class_name( $index );
      $tokens_class_name::set_sid( $db_script->sid );
    }

    return parent::create_resource( $index );
  }
}
