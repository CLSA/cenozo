<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\state;
use cenozo\lib, cenozo\log;

/**
 * Extends the base class query class
 */
class query extends \cenozo\service\query
{
  /**
   * Applies changes to select and modifier objects for all queries which have this
   * subject as its leaf-collection
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\select $select The query's select object to modify
   * @param database\modifier $modifier The query's modifier object to modify
   * @access protected
   * @static
   */
  protected static function add_global_modifications( $select, $modifier )
  {
    // add the total number of participants
    if( $select->has_table_column( '', 'participant_count' ) )
    {
      $state_join_participant =
        'SELECT state_id, COUNT(*) AS participant_count '.
        'FROM participant '.
        'GROUP BY state_id';
      $modifier->left_join(
        sprintf( '( %s ) AS state_join_participant', $state_join_participant ),
        'state.id',
        'state_join_participant.state_id' );
      $select->add_column( 'IFNULL( participant_count, 0 )', 'participant_count', false );
    }
  }
}
