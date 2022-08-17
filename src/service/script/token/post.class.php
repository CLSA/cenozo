<?php
/**
 * post.class.php
 * 
 * Note that this service is used for Limesurvey scripts only (not used for Pine)
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
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

    if( $this->may_continue() )
    {
      // don't allow this service for pine scripts
      if( is_null( $this->db_script ) ) $this->db_script = $this->get_parent_record();

      if( 'pine' == $this->db_script->get_type() )
      {
        log::error( 'The script/token/post service should never be called for a Pine script.' );
        $this->status->set_code( 400 );
      }
      else
      {
        // must have a participant_id in the provided data
        $data = $this->get_file_as_array();
        if( !array_key_exists( 'identifier', $data ) ) $this->status->set_code( 400 );
      }
    }
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

    // get the script and participant records
    if( is_null( $this->db_script ) ) $this->db_script = $this->get_parent_record();
    $this->db_participant = $participant_class_name::get_record_from_identifier( $data['identifier'] );
    if( is_null( $this->db_participant ) )
      throw lib::create( 'exception\runtime', 'Invalid resource provided for token.', __METHOD__ );

    // populate the token
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

    // if the script doesn't repeat and the participant doesn't have its start event yet, then create it
    if( !$this->db_script->repeated )
    {
      if( !is_null( $this->db_script->started_event_type_id ) )
      {
        $event_mod = lib::create( 'database\modifier' );
        $event_mod->where( 'participant_id', '=', $this->db_participant->id );
        $event_mod->where( 'event_type_id', '=', $this->db_script->started_event_type_id );
        if( 0 == $this->db_participant->get_event_count( $event_mod ) )
        {
          $session = lib::create( 'business\session' );
          $db_site = $session->get_site();
          $db_user = $session->get_user();

          $db_event = lib::create( 'database\event' );
          $db_event->participant_id = $this->db_participant->id;
          $db_event->event_type_id = $this->db_script->started_event_type_id;
          $db_event->site_id = $db_site->id;
          $db_event->user_id = $db_user->id;
          $db_event->datetime = $util_class_name::get_datetime_object();
          $db_event->save();
        }
      }
    }
  }

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
      // make sure to set the token class name SID
      if( is_null( $this->db_script ) ) $this->db_script = $this->get_parent_record();
      if( is_null( $this->db_script->sid ) )
        throw lib::create( 'exception\runtime', 'Tried to call script/token/post service for Pine script.', __METHOD__ );
      $tokens_class_name = $this->get_record_class_name( $index );
      $old_sid = $tokens_class_name::get_sid();
      $tokens_class_name::set_sid( $this->db_script->sid );
      $record = parent::create_resource( $index );
      $tokens_class_name::set_sid( $old_sid );
    }
    else
    {
      $record = parent::create_resource( $index );
    }

    return $record;
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
