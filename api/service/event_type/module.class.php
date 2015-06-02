<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\event_type;
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

    // add the total number of events
    if( $select->has_column( 'event_count' ) )
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( 'event' );
      $join_sel->add_column( 'event_type_id' );
      $join_sel->add_column( 'COUNT(*)', 'event_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->group( 'event_type_id' );

      $modifier->left_join(
        sprintf( '( %s %s ) AS event_type_join_event', $join_sel->get_sql(), $join_mod->get_sql() ),
        'event_type.id',
        'event_type_join_event.event_type_id' );
      $select->add_column( 'IFNULL( event_count, 0 )', 'event_count', false );
    }
  }
}
