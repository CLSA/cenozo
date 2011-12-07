<?php
/**
 * base_record.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\ui
 * @filesource
 */

namespace cenozo\ui\push;
use cenozo\log, cenozo\util;

/**
 * Base class for all push operations pertaining to a single record.
 * 
 * @package cenozo\ui
 */
abstract class base_record
  extends \cenozo\ui\push
  implements \cenozo\ui\contains_record
{
  /**
   * Constructor.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $subject The widget's subject.
   * @param string $name The widget's name.
   * @param array $args Push arguments
   * @access public
   */
  public function __construct( $subject, $name, $args )
  {
    parent::__construct( $subject, $name, $args );
    $this->set_record(
      util::create( 'database\\'.$this->get_subject(), $this->get_argument( 'id', NULL ) ) );
  }
  
  /**
   * Method required by the contains_record interface.
   * @author Patrick Emond
   * @return database\record
   * @access public
   */
  public function get_record()
  {
    return $this->record;
  }

  /**
   * Method required by the contains_record interface.
   * @author Patrick Emond
   * @param database\record $record
   * @access public
   */
  public function set_record( $record )
  {
    $this->record = $record;
  }

  /**
   * The record of the item being created.
   * @var record
   * @access private
   */
  private $record = NULL;
}
?>
