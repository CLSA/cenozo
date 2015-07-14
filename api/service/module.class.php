<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
abstract class module extends \cenozo\base_object
{
  /**
   * TODO: document
   */
  public function __construct( $index, $service )
  {
    $this->index = $index;
    $this->service = $service;
  }

  /**
   * Prepares the read parameters for the parent service
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\select The select used by the read service
   * @param database\modifier The modifier used by the read service
   * @access public
   */
  public function prepare_read( $select, $modifier ) {}

  /**
   * Performs operations on all rows after reading
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function post_read( &$row ) {}

  /**
   * Performs operations on the leaf record before writing
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\record The leaf record being written to
   * @access public
   */
  public function pre_write( $record ) {}

  /**
   * Performs operations on the leaf record after writing
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\record The leaf record being written to
   * @access public
   */
  public function post_write( $record ) {}

  /**
   * Validates the use of a module for its parent service
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @access public
   */
  public function validate()
  {
    return true;
  }

  /**
   * Returns this module's subject
   */
  protected function get_subject()
  {
    return $this->service->get_subject( $this->index );
  }

  /**
   * Returns the parent module's (collection's) subject
   */
  protected function get_parent_subject()
  {
    return $this->service->get_subject( $this->index - 1 );
  }

  /**
   * TODO: document
   */
  protected $index = NULL;

  /**
   * TODO: document
   */
  protected $service = NULL;
}
