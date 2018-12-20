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
   * Adds the total number of child records as a column
   * 
   * @param string $table The table that the child records belong to
   * @param database\select The select used by the read service
   * @param database\modifier The modifier used by the read service
   * @param string $joining_table Used to force a many-to-many relationship with the provided table name
   * @access public
   */
  protected function add_count_column( $table, $select, $modifier, $joining_table = NULL )
  {
    $relationship_class_name = lib::get_class_name( 'database\relationship' );

    $subject = $this->get_subject();
    $record_class_name = $this->service->get_record_class_name( $this->index );
    $relationship = $record_class_name::get_relationship( $table );
    if( $relationship_class_name::MANY_TO_MANY === $relationship || !is_null( $joining_table ) )
    {
      if( is_null( $joining_table ) ) $joining_table = sprintf( '%s_has_%s', $subject, $table );
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( $subject );
      $join_sel->add_column( 'id', $subject.'_id' );
      $join_sel->add_column( 'IF( '.$joining_table.'.'.$table.'_id IS NOT NULL, COUNT(*), 0 )', $table.'_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->left_join( $joining_table, $subject.'.id', $joining_table.'.'.$subject.'_id' );
      $join_mod->group( $subject.'.id' );

      $modifier->left_join(
        sprintf( '( %s %s ) AS '.$subject.'_join_'.$table, $join_sel->get_sql(), $join_mod->get_sql() ),
        $subject.'.id',
        $subject.'_join_'.$table.'.'.$subject.'_id' );
      $select->add_column( 'IFNULL( '.$table.'_count, 0 )', $table.'_count', false );
    }
    else
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( $subject );
      $join_sel->add_column( 'id', $subject.'_id' );
      $join_sel->add_column( 'IF( '.$table.'.id IS NULL, 0, COUNT( * ) )', $table.'_count', false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->left_join( $table, $subject.'.id', $table.'.'.$subject.'_id' );
      $join_mod->group( $subject.'.id' );

      $modifier->join(
        sprintf( '( %s %s ) AS '.$subject.'_join_'.$table, $join_sel->get_sql(), $join_mod->get_sql() ),
        $subject.'.id',
        $subject.'_join_'.$table.'.'.$subject.'_id'
      );
      $select->add_table_column( $subject.'_join_'.$table, $table.'_count' );
    }
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
