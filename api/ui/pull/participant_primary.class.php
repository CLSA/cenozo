<?php
/**
 * participant_primary.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\pull;
use cenozo\lib, cenozo\log;

/**
 * pull: participant primary
 */
class participant_primary extends base_primary
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Pull arguments.
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'participant', $args );
  }

  /**
   * Processes arguments, preparing them for the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function prepare()
  {
    // if the uid is provided instead of the id  then fetch the participant id based on the uid
    // NOTE: this must be done before calling the parent prepare() method
    if( isset( $this->arguments['uid'] ) )
    {
      $class_name = lib::get_class_name( 'database\participant' );
      $db_participant = $class_name::get_unique_record( 'uid', $this->arguments['uid'] );

      if( is_null( $db_participant ) )
        throw lib::create( 'exception\argument', 'uid', $this->arguments['uid'], __METHOD__ );

      $this->arguments['id'] = $db_participant->id;
    }

    parent::prepare();
  }

  /**
   * This method executes the operation's purpose.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function execute()
  {
    parent::execute();

    $source_class_name = lib::get_class_name( 'database\source' );
    $cohort_class_name = lib::get_class_name( 'database\cohort' );
    $age_group_class_name = lib::get_class_name( 'database\age_group' );

    $db_participant = $this->get_record();

    // convert ids to human-readable strings
    $this->data['source_name'] =
      is_null( $this->data['source_id'] ) ? NULL : $db_participant->get_source()->name;
    unset( $this->data['source_id'] );
    $this->data['cohort_name'] =
      is_null( $this->data['cohort_id'] ) ? NULL : $db_participant->get_cohort()->name;
    unset( $this->data['cohort_id'] );
    $this->data['age_group_name'] = NULL;
    if( !is_null( $this->data['age_group_id'] ) )
      $this->data['age_group_name'] = $db_participant->get_age_group()->to_string();
    unset( $this->data['age_group_id'] );

    // add the primary address
    $db_address = $db_participant->get_primary_address();
    if( !is_null( $db_address ) )
    {
      $this->data['street'] = is_null( $db_address->address2 )
                      ? $db_address->address1
                      : $db_address->address1.', '.$db_address->address2;
      $this->data['city'] = $db_address->city;
      $this->data['region'] = $db_address->get_region()->name;
      $this->data['postcode'] = $db_address->postcode;
    }
    
    // add the hin information
    $hin_info = $db_participant->get_hin_information();
    
    if( count( $hin_info ) )
    {
      $this->data['hin_access'] = $hin_info['access'] ? 1 : 0;
      $this->data['hin_future_access'] = $hin_info['future_access'] ? 1 : 0;
      $this->data['hin_missing'] = $hin_info['missing'];
    }
    else
    {
      $this->data['hin_access'] = -1; // -1 means there is no access information
      $this->data['hin_future_access'] = -1; // -1 means there is no future access information
      $this->data['hin_missing'] = true;
    }
  }
}
