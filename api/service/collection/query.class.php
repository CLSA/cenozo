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
 * The base class of all query (collection-based get) services
 */
class query extends \cenozo\service\query
{
  /**
   * Processes arguments, preparing them for the service.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function prepare()
  {
    parent::prepare();

    // add the total number of participants
    if( $this->select->has_table_column( '', 'participant_count' ) )
    {
      $this->modifier->left_join( 'collection_has_participant',
        'collection.id', 'collection_has_participant.collection_id' );
      $this->modifier->group( 'collection.id' );
      $this->select->add_column(
        'IF( collection_has_participant.collection_id IS NULL, 0, COUNT(*) )', 'participant_count', false );
    }
  }
}
