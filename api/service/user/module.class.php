<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\user;
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

    // restrict to users who have access to this application
    $join_sel = lib::create( 'database\select' );
    $join_sel->from( 'access' );
    $join_sel->set_distinct( true );
    $join_sel->add_column( 'user_id' );

    $join_mod = lib::create( 'database\modifier' );
    $join_mod->join( 'application_has_site', 'access.site_id', 'application_has_site.site_id' );
    $join_mod->where( 'application_has_site.application_id', '=', $db_application->id );

    // restrict by site
    $db_restrict_site = $this->get_restricted_site();
    if( !is_null( $db_restrict_site ) ) $join_mod->where( 'access.site_id', '=', $db_restrict_site->id );

    $modifier->join(
      sprintf( '( %s %s ) AS user_join_application ', $join_sel->get_sql(), $join_mod->get_sql() ),
      'user.id',
      'user_join_application.user_id' );

    // add the total number of related records
    if( $select->has_column( 'role_count' ) ||
        $select->has_column( 'site_count' ) ||
        $select->has_column( 'last_access_datetime' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'access' );
      $join_sel->add_column( 'user_id' );
      $join_sel->add_column( 'COUNT( DISTINCT access.role_id )', 'role_count', false );
      $join_sel->add_column( 'COUNT( DISTINCT access.site_id )', 'site_count', false );
      $join_sel->add_column( 'MAX( access.datetime )', 'last_access_datetime', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->group( 'user_id' );

      // restrict to roles belonging to this application
      $sub_mod = lib::create( 'database\modifier' );
      $join_mod->join( 'application_has_role', 'access.role_id', 'application_has_role.role_id' );
      $join_mod->where( 'application_has_role.application_id', '=', $db_application->id );

      $modifier->left_join(
        sprintf( '( %s %s ) AS user_join_access', $join_sel->get_sql(), $join_mod->get_sql() ),
        'user.id',
        'user_join_access.user_id' );

      // override columns so that we can fake these columns being in the user table
      if( $select->has_column( 'role_count' ) )
        $select->add_column( 'IFNULL( role_count, 0 )', 'role_count', false );
      if( $select->has_column( 'site_count' ) )
        $select->add_column( 'IFNULL( site_count, 0 )', 'site_count', false );
      if( $select->has_column( 'last_access_datetime' ) )
        $select->add_column( 'user_join_access.last_access_datetime', 'last_access_datetime', false );
    }
  }
}
