<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\language;
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
    // add the total number of participants
    if( $select->has_table_column( '', 'participant_count' ) )
    {
      $language_join_participant =
        'SELECT language_id, COUNT(*) AS participant_count '.
        'FROM participant '.
        'GROUP BY language_id';
      $modifier->left_join(
        sprintf( '( %s ) AS language_join_participant', $language_join_participant ),
        'language.id',
        'language_join_participant.language_id' );
      $select->add_column( 'IFNULL( participant_count, 0 )', 'participant_count', false );
    }

    // add the total number of users
    if( $select->has_table_column( '', 'user_count' ) )
    {
      $language_join_user =
        'SELECT language_id, COUNT(*) AS user_count '.
        'FROM user_has_language '.
        'GROUP BY language_id';
      $modifier->left_join(
        sprintf( '( %s ) AS language_join_user', $language_join_user ),
        'language.id',
        'language_join_user.language_id' );
      $select->add_column( 'IFNULL( user_count, 0 )', 'user_count', false );
    }
  }
}
