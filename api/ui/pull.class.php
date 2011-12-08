<?php
/**
 * pull.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @package cenozo\ui
 * @filesource
 */

namespace cenozo\ui;
use cenozo\lib, cenozo\log;

/**
 * The base class of all pull operationst.
 * 
 * @package cenozo\ui
 */
abstract class pull extends operation
{
  /**
   * Constructor
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $subject The subject of the operation.
   * @param string $name The name of the operation.
   * @param array $args An associative array of arguments to be processed by the pull operation.
   * @access public
   */
  public function __construct( $subject, $name, $args )
  {
    parent::__construct( 'pull', $subject, $name, $args );
  }

  /**
   * Returns the type of data provided by this pull operation.
   * Should either be json or a standard file type (xls, xlsx, html, pdf, csv, and so on)
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @abstract
   * @access public
   */
  abstract public function get_data_type();
}
?>
