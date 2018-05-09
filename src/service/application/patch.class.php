<?php
/**
 * patch.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\application;
use cenozo\lib, cenozo\log;

/**
 * Special service for handling the patch meta-resource
 */
class patch extends \cenozo\service\patch
{
  /**
   * Override parent method
   */
  protected function validate()
  {
    parent::validate();

    if( 300 > $this->status->get_code() )
    {
      $this->get_file_as_array(); // make sure to process the site array before the following checks

      $db_role = lib::create( 'business\session' )->get_role();

      // make sure that only tier 2+ roles can process pending withdraw records
      if( $this->get_argument( 'process_pending_withdraw', false ) && 2 > $db_role->tier )
        $this->status->set_code( 403 );
    }
  }

  /**
   * Override parent method
   */
  protected function execute()
  {
    parent::execute();

    // process all pending withdraw records, if needed
    if( $this->get_argument( 'process_pending_withdraw', false ) )
    {
      $survey_manager = lib::create( 'business\survey_manager' );
      $this->set_data( $survey_manager->process_pending_withdraw() );
    }
  }
}
