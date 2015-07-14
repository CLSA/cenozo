<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\phone;
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

    // add the "participant_uid" column if needed
    if( $select->has_table_alias( 'participant', 'participant_uid' ) )
      $modifier->left_join( 'participant', 'phone.participant_id', 'participant.id' );
  }
}
