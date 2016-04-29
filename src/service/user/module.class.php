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
  public function validate()
  {
    parent::validate();

    if( 300 > $this->get_status()->get_code() )
    {
      $record = $this->get_resource();

      if( $record && $record->id )
      {
        // don't include special users
        $access_mod = lib::create( 'database\modifier' );
        $access_mod->join( 'role', 'access.role_id', 'role.id' );
        $access_mod->where( 'role.special', '=', true );
        if( $record->get_access_count( $access_mod ) ) $this->get_status()->set_code( 403 );
      }
    }
  }

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $db_application = lib::create( 'business\session' )->get_application();

    // don't include special users
    $join_sel = lib::create( 'database\select' );
    $join_sel->from( 'access' );
    $join_sel->add_column( 'user_id' );

    $join_mod = lib::create( 'database\modifier' );
    $join_mod->join( 'role', 'access.role_id', 'role.id' );
    $join_mod->where( 'role.special', '=', true );
    $join_mod->group( 'user_id' );

    $modifier->left_join(
      sprintf( '( %s %s ) AS user_join_special_access', $join_sel->get_sql(), $join_mod->get_sql() ),
      'user.id',
      'user_join_special_access.user_id' );
    $modifier->where( 'user_join_special_access.user_id', '=', NULL );

    // we want to allow direct access to users even if they don't have access to this application/site,
    // so only restrict by application and site if we're getting a list of users, otherwise allow access
    if( is_null( $this->get_resource() ) )
    {
      // only include users with access to this application
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'access' );
      $join_sel->add_column( 'user_id' );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->group( 'user_id' );

      $modifier->join(
        sprintf( '( %s %s ) AS user_join_site_access', $join_sel->get_sql(), $join_mod->get_sql() ),
        'user.id',
        'user_join_site_access.user_id' );

      // restrict by site
      $db_restrict_site = $this->get_restricted_site();
      if( !is_null( $db_restrict_site ) )
      {
        $join_sel = lib::create( 'database\select' );
        $join_sel->from( 'access' );
        $join_sel->set_distinct( true );
        $join_sel->add_column( 'user_id' );

        $join_mod = lib::create( 'database\modifier' );
        $join_mod->where( 'access.site_id', '=', $db_restrict_site->id );

        $modifier->join(
          sprintf( '( %s %s ) AS user_join_application ', $join_sel->get_sql(), $join_mod->get_sql() ),
          'user.id',
          'user_join_application.user_id' );
      }
    }

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
