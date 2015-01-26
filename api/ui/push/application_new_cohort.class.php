<?php
/**
 * appointment_new_cohort.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\lib, cenozo\log;

/**
 * push: appointment new_cohort
 */
class appointment_new_cohort extends base_record
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param array $args Push arguments
   * @cohort public
   */
  public function __construct( $args )
  {
    parent::__construct( 'appointment', 'new_cohort', $args );
  }

  /**
   * This method executes the operation's purpose.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function execute()
  {
    parent::execute();

    $this->get_record()->add_cohort(
      $this->get_argument( 'id_list' ),
      $this->get_argument( 'grouping' ) );
  }
}
