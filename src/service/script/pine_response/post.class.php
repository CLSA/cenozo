<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\script\pine_response;
use cenozo\lib, cenozo\log;

class post extends \cenozo\service\post
{
  /**
   * Override parent method
   */
  public function get_leaf_parent_relationship()
  {
    $relationship_class_name = lib::get_class_name( 'database\relationship' );
    return $relationship_class_name::ONE_TO_MANY;
  }

  /**
   * Override parent method
   */
  protected function validate()
  {
    parent::validate();

    if( $this->may_continue() )
    {
      // don't allow this service for external scripts
      if( 'pine' != $this->get_parent_record()->get_type() )
      {
        log::error( 'The script/token/post service should never be called for non-Pine scripts.' );
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
  protected function prepare() {}

  /**
   * Override parent method
   */
  protected function execute()
  {
    // set the pseudo-record as the service's data
    $this->set_data( $this->get_leaf_record() );
  }

  /**
   * Override parent method
   */
  protected function create_resource( $index )
  {
    $record = NULL;

    if( 'pine_response' == $this->get_subject( $index ) )
    {
      $util_class_name = lib::get_class_name( 'util' );
      $participant_class_name = lib::get_class_name( 'database\participant' );

      // get the pine token as a pseudo-record
      $data = $this->get_file_as_array();
      $db_script = $this->get_parent_record();
      $db_participant = $participant_class_name::get_record_from_identifier( $data['identifier'] );
      if( is_null( $db_participant ) )
        throw lib::create( 'exception\runtime', 'Invalid resource provided for token.', __METHOD__ );

      $cenozo_manager = lib::create( 'business\cenozo_manager', lib::create( 'business\session' )->get_pine_application() );
      try
      {
        $select_obj = array( 'column' => array( 'token' ) );
        $service = sprintf(
          'qnaire/%d/respondent/participant_id=%d?no_activity=1&select=%s',
          $db_script->pine_qnaire_id,
          $db_participant->id,
          $util_class_name::json_encode( $select_obj )
        );
        $response = $cenozo_manager->get( $service );
        $record = array( 'token' => $response->token );
      }
      catch( \cenozo\exception\runtime $e )
      {
        if( false === preg_match( '/Got response code 404/', $e->get_raw_message() ) ) throw $e;

        // 404 means the respondent doesn't exist yet, so create it
        $cenozo_manager->post(
          sprintf( 'qnaire/%d/respondent?no_mail=1', $db_script->pine_qnaire_id ),
          array( 'participant_id' => $db_participant->id )
        );

        // now get the token which was just created
        $select_obj = array( 'column' => array( 'token' ) );
        $service = sprintf(
          'qnaire/%d/respondent/participant_id=%d?no_activity=1&select=%s',
          $db_script->pine_qnaire_id,
          $db_participant->id,
          $util_class_name::json_encode( $select_obj )
        );
        $response = $cenozo_manager->get( $service );
        $record = array( 'token' => $response->token );
      }
    }
    else
    {
      $record = parent::create_resource( $index );
    }

    return $record;
  }
}
