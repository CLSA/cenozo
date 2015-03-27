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

    // only select the site and role's id and name
    $this->select->remove_column(); // remove all columns
    $this->select->add_column( 'site_id' );
    $this->select->add_table_column( 'site', 'name', 'site_name' );
    $this->select->add_column( 'role_id' );
    $this->select->add_table_column( 'role', 'name', 'role_name' );

    // restrict to the current user's access to the current application
    $this->modifier->join( 'site', 'access.site_id', 'site.id' );
    $this->modifier->join( 'role', 'access.role_id', 'role.id' );
    $this->modifier->where(
      'access.user_id', '=', lib::create( 'business\session' )->get_user()->id );
    $this->modifier->where(
      'site.application_id', '=', lib::create( 'business\session' )->get_application()->id );
    $this->modifier->order( 'site.name' );
    $this->modifier->order( 'role.name' );

    // remove restricting to the current site only
    $this->modifier->remove_where( 'site_id' );
  }
}
