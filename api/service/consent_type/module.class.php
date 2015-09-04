<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\consent_type;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\module
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

    // add the total number of accepts
    if( $select->has_column( 'accept_count' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'consent' );
      $join_sel->add_column( 'consent_type_id' );
      $join_sel->add_column( 'COUNT(*)', 'accept_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'accept', '=', true );
      $join_mod->group( 'consent_type_id' );

      $modifier->left_join(
        sprintf( '( %s %s ) AS consent_type_join_accept', $join_sel->get_sql(), $join_mod->get_sql() ),
        'consent_type.id',
        'consent_type_join_accept.consent_type_id' );
      $select->add_column( 'IFNULL( accept_count, 0 )', 'accept_count', false );
    }

    // add the total number of denys
    if( $select->has_column( 'deny_count' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'consent' );
      $join_sel->add_column( 'consent_type_id' );
      $join_sel->add_column( 'COUNT(*)', 'deny_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->where( 'accept', '=', false );
      $join_mod->group( 'consent_type_id' );

      $modifier->left_join(
        sprintf( '( %s %s ) AS consent_type_join_deny', $join_sel->get_sql(), $join_mod->get_sql() ),
        'consent_type.id',
        'consent_type_join_deny.consent_type_id' );
      $select->add_column( 'IFNULL( deny_count, 0 )', 'deny_count', false );
    }
  }
}
