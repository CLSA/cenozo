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
   * @param string $column_name The name of the added column
   * @param string $table The table that the child records belong to
   * @param database\select The select used by the read service
   * @param database\modifier The modifier used by the read service
   * @param string $joining_table Used to force a many-to-many relationship with the provided table name
   * @access public
   */
  protected function add_count_column( $column_name, $table, $select, $modifier, $joining_table = NULL, $count = 'COUNT(*)' )
  {
    $db = lib::create( 'business\session' )->get_database();
    $relationship_class_name = lib::get_class_name( 'database\relationship' );

    $subject = $this->get_subject();
    $subject_id = sprintf( '%s_id', $subject );
    $record_class_name = $this->service->get_record_class_name( $this->index );
    $join_table_name = sprintf( '%s_join_%s', $subject, $table );
    $table_primary_key = sprintf( '%s.id', $table );
    $subject_primary_key = sprintf( '%s.id', $subject );

    $relationship = $record_class_name::get_relationship( $table );
    if( $relationship_class_name::MANY_TO_MANY === $relationship || !is_null( $joining_table ) )
    {
      if( is_null( $joining_table ) )
      {
        $joining_table = sprintf( '%s_has_%s', $subject, $table );
        if( !$db->table_exists( $joining_table ) )
          $joining_table = sprintf( '%s_has_%s', $table, $subject );
      }
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( $subject );
      $join_sel->add_column( 'id', $subject_id );
      $join_sel->add_column( sprintf( 'IF( %s.%s_id IS NOT NULL, %s, 0 )', $joining_table, $table, $count ), $column_name, false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->left_join( $joining_table, $subject_primary_key, sprintf( '%s.%s', $joining_table, $subject_id ) );
      $join_mod->group( $subject_primary_key );

      $modifier->left_join(
        sprintf( '( %s %s ) AS %s', $join_sel->get_sql(), $join_mod->get_sql(), $join_table_name ),
        $subject_primary_key,
        sprintf( '%s.%s', $join_table_name, $subject_id )
      );
      $select->add_column( sprintf( 'IFNULL( %s, 0 )', $column_name ), $column_name, false );
    }
    else
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( $subject );
      $join_sel->add_column( 'id', $subject_id );
      $join_sel->add_column( sprintf( 'IF( %s IS NULL, 0, %s )', $table_primary_key, $count ), $column_name, false );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->left_join( $table, $subject_primary_key, sprintf( '%s.%s', $table, $subject_id ) );
      $join_mod->group( $subject_primary_key );

      $modifier->join(
        sprintf( '( %s %s ) AS %s', $join_sel->get_sql(), $join_mod->get_sql(), $join_table_name ),
        $subject_primary_key,
        sprintf( '%s.%s', $join_table_name, $subject_id )
      );
      $select->add_table_column( $join_table_name, $column_name );
    }
  }

  /**
   * Adds a list of child records as a column
   * 
   * @param string $column_name The name of the added column
   * @param string $table The table that the child records belong to
   * @param string $column Which column name in the $table to get a list of
   * @param database\select The select used by the read service
   * @param database\modifier The modifier used by the read service
   * @param string $joining_table Used to force a many-to-many relationship with the provided table name
   * @param string $order Which column to sort the list by (defaults to the $column value)
   * @access public
   */
  protected function add_list_column(
    $column_name, $table, $column, $select, $modifier, $joining_table = NULL, $join_mod = NULL, $order = NULL )
  {
    $db = lib::create( 'business\session' )->get_database();
    $relationship_class_name = lib::get_class_name( 'database\relationship' );

    $subject = $this->get_subject();
    $subject_id = sprintf( '%s_id', $subject );
    $record_class_name = $this->service->get_record_class_name( $this->index );
    $join_table_name = sprintf( '%s_join_%s', $subject, $table );
    $table_primary_key = sprintf( '%s.id', $table );
    $subject_primary_key = sprintf( '%s.id', $subject );

    $relationship = $record_class_name::get_relationship( $table );
    if( $relationship_class_name::MANY_TO_MANY === $relationship || !is_null( $joining_table ) )
    {
      if( is_null( $joining_table ) )
      {
        $joining_table = sprintf( '%s_has_%s', $subject, $table );
        if( !$db->table_exists( $joining_table ) )
          $joining_table = sprintf( '%s_has_%s', $table, $subject );
      }
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( $joining_table );
      $join_sel->add_column( $subject_id );
      $join_sel->add_column(
        sprintf(
          'GROUP_CONCAT( %s.%s ORDER BY %s.%s SEPARATOR ", " )',
          $table,
          $column,
          $table,
          is_null( $order ) ? $column : $order
        ),
        $column_name,
        false
      );

      if( is_null( $join_mod ) ) $join_mod = lib::create( 'database\modifier' );
      $join_mod->join( $table, sprintf( '%s.%s_id', $joining_table, $table ), $table_primary_key );
      $join_mod->group( $subject_id );

      $modifier->left_join(
        sprintf( '( %s %s ) AS %s', $join_sel->get_sql(), $join_mod->get_sql(), $join_table_name ),
        $subject_primary_key,
        sprintf( '%s.%s', $join_table_name, $subject_id )
      );
      $select->add_table_column( $join_table_name, $column_name );
    }
    else
    {
      $join_sel = lib::create( 'database\select' );
      $join_sel->from( $subject );
      $join_sel->add_column( 'id', $subject_id );
      $join_sel->add_column(
        sprintf( 'GROUP_CONCAT( %s.%s ORDER BY %s.%s SEPARATOR ", " )', $table, $column, $table, $column ),
        $column_name,
        false
      );

      $join_mod = lib::create( 'database\modifier' );
      $join_mod->left_join( $table, $subject_primary_key, sprintf( '%s.%s', $table, $subject_id ) );
      $join_mod->group( $subject_primary_key );

      $modifier->join(
        sprintf( '( %s %s ) AS %s', $join_sel->get_sql(), $join_mod->get_sql(), $join_table_name ),
        $subject_primary_key,
        sprintf( '%s.%s', $join_table_name, $subject_id )
      );
      $select->add_table_column( $join_table_name, $column_name );
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
