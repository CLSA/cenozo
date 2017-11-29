<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
abstract class module extends \cenozo\base_object
{
  /**
   * Constructor
   * 
   * @param integer The module's index
   * @param service\service The module's service
   * @access public
   */
  public function __construct( $index, $service )
  {
    $this->index = $index;
    $this->service = $service;
  }

  /**
   * Prepares the read parameters for the parent service
   * 
   * @param database\select The select used by the read service
   * @param database\modifier The modifier used by the read service
   * @access public
   */
  public function prepare_read( $select, $modifier ) {}

  /**
   * Performs operations on all rows after reading
   * 
   * @access public
   */
  public function post_read( &$row ) {}

  /**
   * Performs operations on the leaf record before writing
   * 
   * @param database\record The leaf record being written to
   * @access public
   */
  public function pre_write( $record ) {}

  /**
   * Performs operations on the leaf record after writing
   * 
   * @param database\record The leaf record being written to
   * @access public
   */
  public function post_write( $record ) {}

  /**
   * Validates the use of a module for its parent service
   * 
   * This method should be extended whenever checking for the validity of the service.
   * When invalid the module should set the status code to something appropriate (ex: 403, 404, etc)
   * @return boolean
   * @access public
   */
  public function validate() {}

  /**
   * Returns information about the parent service
   * 
   * @access protected
   */
  protected function is_leaf_module()
  {
    return $this->get_subject() == $this->service->get_leaf_subject();
  }

  /**
   * Returns information about the parent service
   * 
   * @access protected
   */
  protected function get_method()
  {
    return $this->service->get_method();
  }

  /**
   * Returns information about the parent service
   * 
   * @access protected
   */
  protected function get_subject()
  {
    return $this->service->get_subject( $this->index );
  }

  /**
   * Returns information about the parent service
   * 
   * @access protected
   */
  protected function get_parent_subject()
  {
    return $this->service->get_subject( $this->index - 1 );
  }

  /**
   * Returns information about the parent service
   * 
   * @access protected
   */
  protected function get_resource()
  {
    return $this->service->get_resource( $this->index );
  }

  /**
   * Returns information about the parent service
   * 
   * @access protected
   */
  protected function get_parent_resource()
  {
    return $this->service->get_resource( $this->index - 1 );
  }

  /**
   * Returns information about the parent service
   * 
   * @access protected
   */
  protected function set_data( $data )
  {
    $this->service->set_data( $data );
  }

  /**
   * Returns information about the parent service
   * 
   * @access protected
   */
  protected function get_status()
  {
    return $this->service->get_status();
  }

  /**
   * Returns information about the parent service
   * 
   * @access protected
   */
  public function get_file_as_raw()
  {
    return $this->service->get_file_as_raw();
  }

  /**
   * Returns information about the parent service
   * 
   * @access protected
   */
  public function get_file_as_object()
  {
    return $this->service->get_file_as_object();
  }

  /**
   * Returns information about the parent service
   * 
   * @access protected
   */
  public function get_file_as_array()
  {
    return $this->service->get_file_as_array();
  }

  /**
   * Returns information about the parent service
   * 
   * @access protected
   */
  protected function get_argument( $name, $default = NULL )
  {
    return 1 == func_num_args() ?
      $this->service->get_argument( $name ) :
      $this->service->get_argument( $name, $default );
  }

  /**
   * The module's index
   * @var integer
   * @access private
   */
  private $index = NULL;

  /**
   * The module's service
   * @var service\service
   * @access private
   */
  private $service = NULL;
}
