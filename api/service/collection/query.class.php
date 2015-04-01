<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\collection;
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
      $collection_join_participant =
        'SELECT collection_id, COUNT(*) AS participant_count '.
        'FROM collection_has_participant '.
        'GROUP BY collection_id';
      $modifier->left_join(
        sprintf( '( %s ) AS collection_join_participant', $collection_join_participant ),
        'collection.id',
        'collection_join_participant.collection_id' );
      $select->add_column( 'IFNULL( participant_count, 0 )', 'participant_count', false );
    }

    // add the total number of users
    if( $select->has_table_column( '', 'user_count' ) )
    {
      $collection_join_user =
        'SELECT collection_id, COUNT(*) AS user_count '.
        'FROM user_has_collection '.
        'GROUP BY user_id';
      $modifier->left_join(
        sprintf( '( %s ) AS collection_join_user', $collection_join_user ),
        'collection.id',
        'collection_join_user.collection_id' );
      $select->add_column( 'IFNULL( user_count, 0 )', 'user_count', false );
    }
  }
}
