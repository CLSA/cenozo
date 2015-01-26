<?php
/**
 * user_new_access.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: user new_access
 */
class user_new_access extends base_new_access
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'user', $args );
  }

  /**
   * Validate the operation.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\notice
   * @access protected
   */
  protected function validate()
  {
    parent::validate();

    $site_id_list = $this->get_argument( 'site_id_list' );
    $role_id_list = $this->get_argument( 'role_id_list' );

    // get a list of which appointments we are adding access to
    $appointment_id_list = array();
    foreach( $site_id_list as $site_id )
    {
      $db_site = lib::create( 'database\site', $site_id );
      $appointment_id_list[] = $db_site->appointment_id;
    }
    $appointment_id_list = array_unique( $appointment_id_list );

    // are we adding an admin role?
    $role_class_name = lib::get_class_name( 'database\role' );
    $db_administrator_role = $role_class_name::get_unique_record( 'name', 'administrator' );
    foreach( $role_id_list as $role_id )
    {
      if( $role_id == $db_administrator_role->id )
      { // admin role being added, check the user for admin access to the appointment
        foreach( $appointment_id_list as $appointment_id )
        {
          $access_mod = lib::create( 'database\modifier' );
          $access_mod->where( 'access.role_id', '=', $db_administrator_role->id );
          $access_mod->where( 'site.appointment_id', '=', $appointment_id );
          if( 0 == lib::create( 'business\session' )->get_user()->get_access_count( $access_mod ) )
          {
            $db_appointment = lib::create( 'database\appointment', $appointment_id );
            throw lib::create( 'exception\notice',
              sprintf( 'You require administrator access to a %s site in order to grant '.
                       'administrator access to any %s site.',
                       $db_appointment->name,
                       $db_appointment->name ),
              __METHOD__ );
          }
        }
        break; // no need to keep looping through roles
      }
    }
  }
}
