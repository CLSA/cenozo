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

    $tokens_class_name = lib::get_class_name( 'database\limesurvey\tokens' );

    // create the participant record
    $survey_manager = lib::create( 'business\survey_manager' );
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $data = $this->get_file_as_array();

    // populate the token
    if( is_null( $this->db_script ) ) $this->db_script = $this->get_parent_record();
    $this->db_participant = array_key_exists( 'uid', $data )
                    ? $participant_class_name::get_unique_record( 'uid', $data['uid'] )
                    : lib::create( 'database\participant', $data['participant_id'] );
    $db_tokens = $this->get_leaf_record();
    $db_tokens->token = $db_tokens::determine_token_string( $this->db_participant, $this->db_script->repeated );

    // if the token already exists then don't re-create it
    $tokens_mod = lib::create( 'database\modifier' );
    $tokens_mod->where( 'token', '=', $db_tokens->token );
    if( 0 < $tokens_class_name::count( $tokens_mod ) )
    {
      $this->set_data( array( 'uid' ) ); // since the token comes from the uid
      $this->status->set_code( 409 );
    }
    else $survey_manager->populate_token( $this->db_script, $this->db_participant, $db_tokens );
  }

  /**
   * Override parent method
   */
  protected function finish()
  {
    parent::finish();

    $util_class_name = lib::get_class_name( 'util' );

    $add_event = true;

    if( !$this->db_script->repeated )
    { // if the script doesn't repeat then avoid adding duplicate start events
      $event_mod = lib::create( 'database\modifier' );
      $event_mod->where( 'participant_id', '=', $this->db_participant->id );
      $event_mod->where( 'event_type_id', '=', $this->db_script->started_event_type_id );
      if( 0 < $this->db_participant->get_event_count( $event_mod ) ) $add_event = false;
    }

    if( $add_event )
    {
      $db_event = lib::create( 'database\event' );
      $db_event->participant_id = $this->db_participant->id;
      $db_event->event_type_id = $this->db_script->started_event_type_id;
      $db_event->datetime = $util_class_name::get_datetime_object();
      $db_event->save();
    }
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
      if( is_null( $this->db_script ) ) $this->db_script = $this->get_parent_record();
      $tokens_class_name = $this->get_record_class_name( $index );
      $tokens_class_name::set_sid( $this->db_script->sid );
    }

    return parent::create_resource( $index );
  }

  /**
   * A cache of the script record
   * @var database\script
   * @access protected
   */
  protected $db_script = NULL;

  /**
   * A cache of the participant record
   * @var database\participant
   * @access protected
   */
  protected $db_participant = NULL;
}
