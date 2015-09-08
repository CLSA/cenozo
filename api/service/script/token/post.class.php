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
    $db_script = $this->get_parent_record();
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $data = $this->get_file_as_array();

    $db_participant = array_key_exists( 'uid', $data )
                    ? $participant_class_name::get_unique_record( 'uid', $data['uid'] )
                    : lib::create( 'database\participant', $data['participant_id'] );

    // fill in the token based on the script and participant
    $db_tokens = $this->get_leaf_record();
    $db_tokens->token = $db_tokens::determine_token_string( $db_participant, $db_script->repeated );
    $db_tokens->firstname = $db_participant->honorific.' '.$db_participant->first_name;
    if( 0 < strlen( $db_participant->other_name ) )
      $db_tokens->firstname .= sprintf( ' (%s)', $db_participant->other_name );
    $db_tokens->lastname = $db_participant->last_name;
    $db_tokens->email = $db_participant->email;

/* TODO: token attribute management
    $data_manager = lib::create( 'business\data_manager' );
    $db_surveys = lib::create( 'database\limesurvey\surveys', $db_script->sid );
    foreach( $db_surveys->get_token_attribute_names() as $key => $value )
    {
      $attribute = $data_manager->get_value( $value );
      if( is_null( $attribute ) )
        $attribute = $data_manager->get_participant_value( $db_participant, $value );
      $db_tokens->$key = 
    }
*/
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
