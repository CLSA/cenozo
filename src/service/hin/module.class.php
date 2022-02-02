<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\hin;
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
      $service_class_name = lib::get_class_name( 'service\service' );
      $db_application = lib::create( 'business\session' )->get_application();
      $db_hin = $this->get_resource();
      $method = $this->get_method();

      // make sure the application has access to the participant
      if( $db_application->release_based && !is_null( $db_hin ) )
      {
        $participant_id = $db_hin->participant_id;
        $modifier = lib::create( 'database\modifier' );
        $modifier->where( 'participant_id', '=', $participant_id );
        if( 0 == $db_application->get_participant_count( $modifier ) )
        {
          $this->get_status()->set_code( 404 );
          return;
        }
      }

      if( $service_class_name::is_write_method( $method ) )
      {
        $db_role = lib::create( 'business\session' )->get_role();

        // make sure that only tier 3 roles can delete/edit
        if( ( 'DELETE' == $method || 'PATCH' == $method ) && 3 > $db_role->tier )
        {
          $this->get_status()->set_code( 403 );
        }
        // if the region is provided then make sure the code is valid
        else if( 'DELETE' != $method && false === $db_hin->is_valid() )
        {
          $this->set_data( sprintf(
            'The code you have provided is not a valid %s HIN.  Please double check the code and try again.',
            $db_hin->get_region()->name ) );
          $this->get_status()->set_code( 306 );
        }
      }
    }
  }

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    $util_class_name = lib::get_class_name( 'util' );

    parent::prepare_read( $select, $modifier );

    $modifier->left_join( 'region', 'hin.region_id', 'region.id' );
    $modifier->left_join( 'country', 'region.country_id', 'country.id' );
  }

  /**
   * Extend parent method
   */
  public function pre_write( $record )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $session = lib::create( 'business\session' );
    $db_role = $session->get_role();

    // set the date to now
    $record->datetime = $util_class_name::get_datetime_object()->format( 'Y-m-d H:i:s' );
  }
}
