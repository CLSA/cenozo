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
  public function __construct( $index, $service, $roll_has = false )
  {
    $this->index = $index;
    $this->service = $service;
    $this->role_has = $roll_has;
  }

  /**
   * Prepares the read parameters for the parent service
   * 
   * @param database\select The select used by the read service
   * @param database\modifier The modifier used by the read service
   * @access public
   */
  public function prepare_read( $select, $modifier )
  {
    if( $this->role_has )
    {
      $session = lib::create( 'business\session' );
      $db_application = $session->get_application();
      $db_role = $session->get_role();
      $subject = $this->get_subject();

      // add the access column (whether the role has access)
      if( $select->has_column( 'access' ) )
      {
        $join_table_name = sprintf( 'current_role_has_%s', $subject );
        $join_mod = lib::create( 'database\modifier' );
        $join_mod->where(
          sprintf( '%s.id', $subject ),
          '=',
          sprintf( '%s.%s_id', $join_table_name, $subject ),
          false
        );
        $join_mod->where( sprintf( '%s.role_id', $join_table_name ), '=', $db_role->id );
        $modifier->join_modifier( sprintf( 'role_has_%s', $subject ), $join_mod, 'left', $join_table_name );
        $select->add_column(
          sprintf( '%s.%s_id IS NOT NULL', $join_table_name, $subject ),
          'access',
          false,
          'boolean'
        );
      }

      // add the role count
      if( $select->has_column( 'role_count' ) )
      {
        $join_mod = lib::create( 'database\modifier' );
        $join_mod->join(
          'application_type_has_role',
          sprintf( 'role_has_%s.role_id', $subject ),
          'application_type_has_role.role_id'
        );
        $join_mod->where(
          'application_type_has_role.application_type_id',
          '=',
          $db_application->application_type_id
        );
        $this->add_count_column( 'role_count', 'role', $select, $modifier, NULL, 'COUNT(*)', $join_mod );
      }

      // add the list of roles
      if( $select->has_column( 'role_list' ) )
      {
        $join_mod = lib::create( 'database\modifier' );
        $join_mod->join(
          'application_type_has_role',
          sprintf( 'role_has_%s.role_id', $subject ),
          'application_type_has_role.role_id'
        );
        $join_mod->where(
          'application_type_has_role.application_type_id',
          '=',
          $db_application->application_type_id
        );

        $this->add_list_column( 'role_list', 'role', 'name', $select, $modifier, NULL, $join_mod );
      }
    }
  }

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
   * @param string $count The definition of the counting column (default is COUNT(*))
   * @param database|modifier $special_join_mod A special modifier used when creating the joining table
   * @param string $join_table_name Used to customize the name of the joining table (for multiple joins to same table)
   * @access public
   */
  protected function add_count_column( $column_name, $table, $select, $modifier, $joining_table = NULL, $count = 'COUNT(*)', $special_join_mod = NULL, $join_table_name = NULL )
  {
    $db = lib::create( 'business\session' )->get_database();
    $relationship_class_name = lib::get_class_name( 'database\relationship' );

    $subject = $this->get_subject();
    $subject_id = sprintf( '%s_id', $subject );
    $record_class_name = $this->service->get_record_class_name( $this->index );
    if( is_null( $join_table_name ) ) $join_table_name = sprintf( '%s_count_join_%s', $subject, $table );
    $table_primary_key = sprintf( '%s.id', $table );
    $subject_primary_key = sprintf( '%s.id', $subject );
    $join_mod = is_null( $special_join_mod ) ? lib::create( 'database\modifier' ) : $special_join_mod;

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

      $join_mod->left_join(
        $joining_table,
        $subject_primary_key,
        sprintf( '%s.%s', $joining_table, $subject_id ),
        NULL,
        true
      );
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
   * @param database\select $select The select used by the read service
   * @param database\modifier $modifier The modifier used by the read service
   * @param string $joining_table Used to force a many-to-many relationship with the provided table name
   * @param database|modifier $special_join_mod A special modifier used when creating the joining table
   * @param string $order Which column to sort the list by (defaults to the $column value)
   * @param string $separator What separator to use between list items
   * @param boolean $table_prefix Whether to prefix the column with the table name
   * @access public
   */
  protected function add_list_column(
    $column_name, $table, $column, $select, $modifier, $joining_table = NULL, $special_join_mod = NULL,
    $order = NULL, $separator = ', ', $table_prefix = true )
  {
    $db = lib::create( 'business\session' )->get_database();
    $relationship_class_name = lib::get_class_name( 'database\relationship' );

    $subject = $this->get_subject();
    $subject_id = sprintf( '%s_id', $subject );
    $record_class_name = $this->service->get_record_class_name( $this->index );
    $join_table_name = sprintf( '%s_list_join_%s', $subject, $table );
    $table_primary_key = sprintf( '%s.id', $table );
    $subject_primary_key = sprintf( '%s.id', $subject );
    $order_column = is_null( $order ) ? $column : $order;
    $column_sql = sprintf(
      'GROUP_CONCAT( %s ORDER BY %s SEPARATOR "%s" )',
      $table_prefix ? sprintf( '%s.%s', $table, $column ) : $column,
      $table_prefix ? sprintf( '%s.%s', $table, $order_column ) : $order_column,
      $separator
    );
    $join_mod = is_null( $special_join_mod ) ? lib::create( 'database\modifier' ) : $special_join_mod;

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
      $join_sel->add_column( $column_sql, $column_name, false );

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
      $join_sel->add_column( $column_sql, $column_name, false );

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
   * @access protected
   */
  protected $service = NULL;

  /**
   * Whether the module is defined by whether a role has access to it or not (N-to-N relationship with role)
   * @var boolean
   * @access protected
   */
  protected $role_has = false;
}
