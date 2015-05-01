<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\alternate;
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
    $valid = parent::validate();

    if( $valid )
    {
      // addresses can only be listed in the context of a participant
      $valid = 'participant' == $this->get_parent_subject();
    }

    return $valid;
  }

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    $util_class_name = lib::get_class_name( 'util' );

    parent::prepare_read( $select, $modifier );

    // add the "types" column if needed
    if( $select->has_column( 'types' ) )
    {
      $column = sprintf( 'REPLACE( TRIM( CONCAT( %s, %s, %s ) ), "  ", ", " )',
                  'IF( alternate, " alternate ", "" )',
                  'IF( informant, " informant ", "" )',
                  'IF( proxy, " proxy ", "" )' );
      $select->add_column( $column, 'types', false );
    }
  }
}
