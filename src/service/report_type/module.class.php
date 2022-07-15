<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\report_type;
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
      $session = lib::create( 'business\session' );
      $record = $this->get_resource();

      if( !is_null( $record ) )
      {
        // restrict by application
        $application_type_mod = lib::create( 'database\modifier' );
        $application_type_mod->where(
          'application_type.id', '=', $session->get_application()->get_application_type()->id );
        if( 0 == $record->get_application_type_count( $application_type_mod ) )
        {
          $this->get_status()->set_code( 404 );
          return;
        }

        // restrict by role
        $modifier = lib::create( 'database\modifier' );
        $modifier->where( 'role_id', '=', $session->get_role()->id );
        if( 0 == $record->get_role_count( $modifier ) )
        {
          $this->get_status()->set_code( 404 );
          return;
        }
      }
    }
  }

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $session = lib::create( 'business\session' );
    $application_id = $session->get_application()->id;

    // restrict by application type
    $modifier->join(
      'application_type_has_report_type', 'report_type.id', 'application_type_has_report_type.report_type_id' );
    $modifier->join(
      'application_type', 'application_type_has_report_type.application_type_id', 'application_type.id' );
    $modifier->join( 'application', 'application_type.id', 'application.application_type_id' );
    $modifier->where( 'application.id', '=', lib::create( 'business\session' )->get_application()->id );

    // restrict by role
    $modifier->join( 'role_has_report_type', 'report_type.id', 'role_has_report_type.report_type_id', false );
    $modifier->where( 'role_has_report_type.role_id', '=', $session->get_role()->id );
  }
}
