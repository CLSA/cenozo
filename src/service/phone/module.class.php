<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\phone;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\module
{
  /**
   * Extend parent method
   */
  public function validate()
  {
    parent::validate();

    // make sure the application has access to the participant
    $db_application = lib::create( 'business\session' )->get_application();
    $db_phone = $this->get_resource();
    if( $db_application->release_based && !is_null( $db_phone ) )
    {
      $participant_id = $db_phone->participant_id;
      if( is_null( $participant_id ) ) $participant_id = $db_phone->get_alternate()->participant_id;
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'participant_id', '=', $participant_id );
      if( 0 == $db_application->get_participant_count( $modifier ) ) $this->get_status()->set_code( 404 );
    }
  }

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    // add the "participant_uid" column if needed
    if( $select->has_table_alias( 'participant', 'participant_uid' ) )
      $modifier->left_join( 'participant', 'phone.participant_id', 'participant.id' );
  }
}
