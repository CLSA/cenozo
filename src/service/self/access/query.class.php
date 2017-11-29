<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\self\access;
use cenozo\lib, cenozo\log;

/**
 * Extends parent class
 */
class query extends \cenozo\service\query
{
  /**
   * Override parent method since self is a meta-resource
   */
  protected function create_resource( $index )
  {
    return 0 == $index ? lib::create( 'business\session' )->get_user() : parent::create_resource( $index );
  }

  /**
   * Processes arguments, preparing them for the service.
   * 
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

    $this->modifier->join( 'site', 'access.site_id', 'site.id' );
    $this->modifier->join( 'role', 'access.role_id', 'role.id' );
    $this->modifier->where( 'access.user_id', '=', lib::create( 'business\session' )->get_user()->id );
    $this->modifier->order( 'site.name' );
    $this->modifier->order( 'role.name' );

    // remove the where created by the access module restricting by site, we want all access to be returned
    $this->modifier->remove_where( 'access.site_id' );
  }
}
