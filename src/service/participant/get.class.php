<?php
/**
 * get.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service\participant;
use cenozo\lib, cenozo\log;

/**
 * Special service for handling the get meta-resource
 */
class get extends \cenozo\service\get
{
  /**
   * Override parent method
   */
  protected function setup()
  {
    parent::setup();

    // remove withdraw_option from select
    if( $this->select->has_column( 'withdraw_option' ) )
    {
      $this->include_withdraw_option = true;
      $this->select->remove_column_by_column( 'withdraw_option' );
    }
  }

  /**
   * Override parent method since self is a meta-resource
   */
  public function execute()
  {
    parent::execute();

    // add withdraw option to the data
    if( $this->include_withdraw_option )
      $this->data['withdraw_option'] = $this->get_leaf_record()->get_withdraw_option();
  }

  /**
   * Whether to include the participant's withdraw option
   * @var boolean
   * @access protected
   */
  protected $include_withdraw_option = false;
}
