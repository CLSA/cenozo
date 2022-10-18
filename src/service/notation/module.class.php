<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\notation;
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

    if( $this->service->may_continue() )
    {
      // restrict by application-type
      $db_application = lib::create( 'business\session' )->get_application();
      $record = $this->get_resource();
      if( $record && !is_null( $record->application_type_id ) &&
          $record->application_type_id != $db_application->application_type_id )
      {
        $this->get_status()->set_code( 404 );
      }
    }
  }

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $db_application = lib::create( 'business\session' )->get_application();

    // only include sites which belong to this application-type
    $modifier->where(
      sprintf( 'IFNULL( notation.application_type_id, %d )', $db_application->application_type_id ),
      '=',
      $db_application->application_type_id
    );
  }
}
