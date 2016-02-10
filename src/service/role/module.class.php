<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
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

    $db_application = lib::create( 'business\session' )->get_application();

    // only include roles which belong to this application
    $modifier->join( 'application_has_role', 'role.id', 'application_has_role.role_id' );
    $modifier->where( 'application_has_role.application_id', '=', $db_application->id );

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
      $join_mod->group( 'role_id' );

      $modifier->left_join(
        sprintf( '( %s %s ) AS role_join_access', $join_sel->get_sql(), $join_mod->get_sql() ),
        'role.id',
        'role_join_access.role_id' );

      // restrict to sites/users belonging to this application
      $join_mod->join( 'application_has_site', 'access.site_id', 'application_has_site.site_id' );
      $join_mod->where( 'application_has_site.application_id', '=', $db_application->id );

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
