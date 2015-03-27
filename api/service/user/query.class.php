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

    // add the total number of users
    if( $this->select->has_table_column( '', 'user_count' ) )
    {
      $this->modifier->left_join( 'access', 'user.id', 'access.user_id' );
      $this->modifier->group( 'user.id' );
      $this->select->add_column(
        'IF( access.user_id IS NULL, 0, COUNT( DISTINCT access.user_id ) )', 'user_count', false );
    }

    // link to the user's last activity and add the activity's datetime
    $this->modifier->left_join( 'user_last_activity', 'user.id', 'user_last_activity.user_id' );
    $this->modifier->left_join(
      'activity', 'user_last_activity.activity_id', 'last_activity.id', 'last_activity' );
    $this->select->add_table_column( 'last_activity', 'datetime', 'last_datetime' );
  }
}
