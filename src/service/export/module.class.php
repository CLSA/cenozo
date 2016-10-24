<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\export;
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
      // restrict by application
      $record = $this->get_resource();
      if( $record && !is_null( $record->application_id ) &&
          $record->application_id != lib::create( 'business\session' )->get_application()->id )
        $this->get_status()->set_code( 404 );
    }
  }

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    // restriction to current application
    $modifier->join( 'application', 'export.application_id', 'application.id' );
    $modifier->where( 'application.id', '=', lib::create( 'business\session' )->get_application()->id );

    $modifier->join( 'user', 'export.user_id', 'user.id' );

    if( !is_null( $this->get_resource() ) )
    {
      // include the user's first/last/name as supplemental data
      $select->add_column(
        'CONCAT( user.first_name, " ", user.last_name, " (", user.name, ")" )',
        'formatted_user_id',
        false );
    }
  }
}
