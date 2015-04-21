<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\user;
use cenozo\lib, cenozo\log;

/**
 * Extends the base class query class
 */
class read_modification extends \cenozo\base_object
{
  /**
   * Applies changes to select and modifier objects for all queries which have this
   * subject as its leaf-collection
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\select $select The query's select object to modify
   * @param database\modifier $modifier The query's modifier object to modify
   * @access public
   * @static
   */
  public static function apply( $select, $modifier )
  {
    $session = lib::create( 'business\session' );

    // restrict list by role
    if( !$session->get_role()->all_sites )
    {
      $modifier->join( 'access', 'user.id', 'access.user_id' );
      $modifier->where( 'access.site_id', '=', $session->get_site()->id );
    }

    // add the total number of related records
    if( $select->has_table_column( '', 'role_count' ) ||
        $select->has_table_column( '', 'user_count' ) ||
        $select->has_table_column( '', 'last_access_datetime' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'access' );
      $join_sel->add_column( 'user_id' );
      $join_sel->add_column( 'COUNT( DISTINCT role_id )', 'role_count', false );
      $join_sel->add_column( 'COUNT( DISTINCT site_id )', 'site_count', false );
      $join_sel->add_column( 'MAX( datetime )', 'last_access_datetime', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->join( 'site', 'access.site_id', 'site.id' );
      $join_mod->where( 'site.application_id', '=', $session->get_application()->id );
      $join_mod->group( 'user_id' );

      $modifier->left_join(
        sprintf( '( %s %s ) AS user_join_access', $join_sel->get_sql(), $join_mod->get_sql() ),
        'user.id',
        'user_join_access.user_id' );

      // override columns so that we can fake these columns being in the user table
      if( $select->has_table_column( '', 'role_count' ) )
        $select->add_column( 'IFNULL( role_count, 0 )', 'role_count', false );
      if( $select->has_table_column( '', 'site_count' ) )
        $select->add_column( 'IFNULL( site_count, 0 )', 'site_count', false );
      if( $select->has_table_column( '', 'last_access_datetime' ) )
        $select->add_column( 'user_join_access.last_access_datetime', 'last_access_datetime', false );
    }
  }
}
