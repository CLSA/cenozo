<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\access;
use cenozo\lib, cenozo\log;

/**
 * Extends the base class to provide a "self" method for returning the current user's access only
 */
class query extends \cenozo\service\query
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $path The URL of the service (not including the base)
   * @param array $args An associative array of arguments to be processed by the service.
   * @access public
   */
  public function __construct( $path, $args = NULL )
  {
    parent::__construct( $path, $args );
  }

  /**
   * Processes arguments, preparing them for the service.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function prepare()
  {
    parent::prepare();

    // restrict to the current user's access to the current application
    $this->modifier->where(
      'user_id', '=', lib::create( 'business\session' )->get_user()->id );
    $this->modifier->where(
      'site.application_id', '=', lib::create( 'business\session' )->get_application()->id );
    $this->modifier->order( 'site.name' );
    $this->modifier->order( 'role.name' );

    // remove restricting to the current site only
    $this->modifier->remove_where( 'site_id' );
  }

  /**
   * TODO: document
   */
  protected function execute()
  {
    parent::execute();

    // add names of sites and roles
    $site_class_name = lib::get_class_name( 'database\site' );
    $role_class_name = lib::get_class_name( 'database\role' );
    
    // create lookup arrays
    $site_list = array();
    foreach( $site_class_name::arrayselect() as $row ) $site_list[$row['id']] = $row['name'];
    $role_list = array();
    foreach( $role_class_name::arrayselect() as $row ) $role_list[$row['id']] = $row['name'];

    foreach( $this->data['results'] as $index => $row )
    {
      unset( $this->data['results'][$index]['user_id'] );
      $this->data['results'][$index]['site_name'] = $site_list[$row['site_id']];
      $this->data['results'][$index]['role_name'] = $role_list[$row['role_id']];
    }
  }
}
