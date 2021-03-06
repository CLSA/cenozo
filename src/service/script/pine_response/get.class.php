<?php
/**
 * get.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\script\pine_response;
use cenozo\lib, cenozo\log;

class get extends \cenozo\service\get
{
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
      $db_script = $this->get_parent_record();
      $db_participant = $participant_class_name::get_record_from_identifier( $this->get_resource_value( 1 ) );
      if( !is_null( $db_participant ) )
      {
        $cenozo_manager = lib::create( 'business\cenozo_manager', lib::create( 'business\session' )->get_pine_application() );
        try
        {
          $select_obj = array( 'column' => array( 'token', 'end_datetime' ) );
          $service = sprintf(
            'qnaire/%d/respondent/participant_id=%d?no_activity=1&select=%s',
            $db_script->pine_qnaire_id,
            $db_participant->id,
            $util_class_name::json_encode( $select_obj )
          );
          $response = $cenozo_manager->get( $service );
          $record = array( 'token' => $response->token, 'end_datetime' => $response->end_datetime );
        }
        catch( \cenozo\exception\runtime $e )
        {
          if( false === preg_match( '/Got response code 404/', $e->get_raw_message() ) ) throw $e;
        }
      }
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
  public function get_leaf_parent_relationship()
  {
    $relationship_class_name = lib::get_class_name( 'database\relationship' );
    return $relationship_class_name::ONE_TO_MANY;
  }

  /**
   * Override parent method
   */
  protected function prepare()
  {
    if( is_null( $this->get_leaf_record() ) ) $this->status->set_code( 404 );
  }

  /**
   * Override parent method
   */
  protected function execute()
  {
    // set the pseudo-record as the service's data
    $this->set_data( $this->get_leaf_record() );
  }
}
