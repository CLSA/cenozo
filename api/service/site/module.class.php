<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\site;
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
    // check for role's all_site setting before viewing any site
    $allowed = true;
    $session = lib::create( 'business\session' );
    if( !$session->get_role()->all_sites )
    {
      $db_site = $this->get_resource();
      if( $db_site ) $allowed = $db_site->id == $session->get_site()->id;
    }

    return $allowed;
  }

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $session = lib::create( 'business\session' );
    $db_application = $session->get_application();

    // only include sites which belong to this application
    $modifier->where( 'site.application_id', '=', $db_application->id );

    // add the total number of related records
    if( $select->has_column( 'role_count' ) ||
        $select->has_column( 'user_count' ) ||
        $select->has_column( 'last_access_datetime' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'access' );
      $join_sel->add_column( 'site_id' );
      $join_sel->add_column( 'COUNT( DISTINCT role_id )', 'role_count', false );
      $join_sel->add_column( 'COUNT( DISTINCT user_id )', 'user_count', false );
      $join_sel->add_column( 'MAX( datetime )', 'last_access_datetime', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->group( 'site_id' );

      $modifier->left_join(
        sprintf( '( %s %s ) AS site_join_access', $join_sel->get_sql(), $join_mod->get_sql() ),
        'site.id',
        'site_join_access.site_id' );

      // restrict to roles belonging to this application
      $sub_mod = lib::create( 'database\modifier' );
      $join_mod->join( 'application_has_role', 'access.role_id', 'application_has_role.role_id' );
      $join_mod->where( 'application_has_role.application_id', '=', $db_application->id );

      // override columns so that we can fake these columns being in the site table
      if( $select->has_column( 'role_count' ) )
        $select->add_column( 'IFNULL( role_count, 0 )', 'role_count', false );
      if( $select->has_column( 'user_count' ) )
        $select->add_column( 'IFNULL( user_count, 0 )', 'user_count', false );
      if( $select->has_column( 'last_access_datetime' ) )
        $select->add_column( 'site_join_access.last_access_datetime', 'last_access_datetime', false );
    }
  }

  /**
   * Extend parent method
   */
  public function pre_write( $record )
  {
    parent::pre_write( $record );

    // set the current application as the site's owner
    $record->application_id = lib::create( 'business\session' )->get_application()->id;
  }

  /**
   * Extend parent method
   */
  public function post_write( $record )
  {
    parent::post_write( $record );

    // create setting record if there isn't one already
    if( is_null( $record->get_setting() ) )
    {
      $db_setting = lib::create( 'database\setting' );
      $db_setting->site_id = $record->id;
      $db_setting->save();
    }
  }
}
