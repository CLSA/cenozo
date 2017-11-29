<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\role;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\site_restricted_module
{
  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    
    $session = lib::create( 'business\session' );
    $db_application = $session->get_application();
    $db_site = $session->get_site();
    $db_role = $session->get_role();

    // do not include special roles
    $modifier->where( 'role.special', '=', false );

    // only include roles which belong to this application
    $modifier->join( 'application_type_has_role', 'role.id', 'application_type_has_role.role_id' );
    $modifier->where( 'application_type_has_role.application_type_id', '=', $db_application->application_type_id );

    // add the total number of related records
    if( $select->has_column( 'site_count' ) ||
        $select->has_column( 'user_count' ) ||
        $select->has_column( 'last_access_datetime' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'access' );
      $join_sel->add_column( 'role_id' );
      $join_sel->add_column( 'COUNT( DISTINCT user_id )', 'user_count', false );
      $join_sel->add_column( 'COUNT( DISTINCT site_id )', 'site_count', false );
      $join_sel->add_column( 'MAX( datetime )', 'last_access_datetime', false );

      $join_mod = lib::create( 'database\modifier' );
      if( !$db_role->all_sites ) $join_mod->where( 'site_id', '=', $db_site->id );
      $join_mod->group( 'role_id' );

      $modifier->left_join(
        sprintf( '( %s %s ) AS role_join_access', $join_sel->get_sql(), $join_mod->get_sql() ),
        'role.id',
        'role_join_access.role_id' );

      // restrict by site
      $db_restrict_site = $this->get_restricted_site();
      if( !is_null( $db_restrict_site ) ) $join_mod->where( 'site.id', '=', $db_restrict_site->id );

      // override columns so that we can fake these columns being in the role table
      if( $select->has_column( 'user_count' ) )
        $select->add_column( 'IFNULL( user_count, 0 )', 'user_count', false );
      if( $select->has_column( 'site_count' ) )
        $select->add_column( 'IFNULL( site_count, 0 )', 'site_count', false );
      if( $select->has_column( 'last_access_datetime' ) )
        $select->add_column( 'role_join_access.last_access_datetime', 'last_access_datetime', false );
    }
  }
}
