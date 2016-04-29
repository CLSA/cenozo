<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\consent;
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

    if( 300 > $this->get_status()->get_code() )
    {
      // make sure the application has access to the participant
      $db_application = lib::create( 'business\session' )->get_application();
      $db_consent = $this->get_resource();
      if( $db_application->release_based && !is_null( $db_consent ) )
      {
        $modifier = lib::create( 'database\modifier' );
        $modifier->where( 'participant_id', '=', $db_consent->participant_id );
        if( 0 == $db_application->get_participant_count( $modifier ) ) $this->get_status()->set_code( 404 );
      }
    }
  }
}
