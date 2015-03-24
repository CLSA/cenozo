<?php
/**
 * select.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * This class is used to create select queries
 */
class select extends \cenozo\base_object
{
  /**
   * Set the base table to select from
   * 
   * Only one table name should be provided.  Joining tables must be defined using a modifier object
   * @param string $table
   * @param string $alias An optional alias for the table
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function from( $table, $alias = NULL )
  {
    $this->table_name = $table;
    $this->table_alias = $alias;
  }

  /**
   * Returns the table name
   * 
   * @return string
   * @access public
   */
  public function get_table_name()
  {
    return 0 < strlen( $this->table_name ) ? $this->table_name : NULL;
  }

  /**
   * Returns the table alias
   * 
   * @return string
   * @access public
   */
  public function get_table_alias()
  {
    return $this->table_alias;
  }

  /**
   * Adds a column from a specific table to the select
   * 
   * Note that this will overwrite any existing column with the same parameters.
   * @param string $table The table to select the column from
   * @param string $column The column to select
   * @param string $alias The optional alias for the column
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function add_table_column( $table, $column, $alias = NULL )
  {
    // sanitize
    if( is_null( $column ) || 0 == strlen( $column ) )
      throw lib::create( 'exception\argument', 'column', $column, __METHOD__ );
    if( !is_null( $alias ) && 0 == strlen( $alias ) )
      throw lib::create( 'exception\argument', 'alias', $alias, __METHOD__ );

    if( is_null( $table ) ) $table = '';
    if( is_null( $alias ) ) $alias = $column;
    if( !array_key_exists( $table, $this->column_list ) ) $this->column_list[$table] = array();
    $this->column_list[$table][$alias] = $column;
  }

  /**
   * Adds all columns for a table to the select (table.*)
   * 
   * @param string $table The table to select * on.  If no table is provided then the base table
   *               defined by the from() method will be used.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function add_all_table_columns( $table = NULL )
  {
    $this->add_table_column( $table, '*' );
  }

  /**
   * Adds a column from the main table defined by the from() method
   * 
   * @param string $column The column to select
   * @param string $alias The optional alias for the column
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function add_column( $column, $alias = NULL )
  {
    $this->add_table_column( NULL, $column, $alias );
  }

  /**
   * Removes one or more columns from the select
   * 
   * @param string $table Restricts removal to a particular table (or the select's main table if null)
   *               If a table has an alias then the alias must be used
   * @param string $column Restricts removal to a particular column
   * @param string $alias Restricts removal to a particular alias
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function remove_column( $table = NULL, $column = NULL, $alias = NULL )
  {
    if( is_null( $table ) ) $table = '';

    if( array_key_exists( $table, $this->column_list ) )
    {
      if( is_null( $column ) && is_null( $alias ) ) unset( $this->column_list[$table] );
      else
      {
        if( is_null( $column ) )
        {
          unset( $this->column_list[$table][$alias] );
        }
        else
        {
          foreach( $this->column_list[$table] as $table_alias => $table_column )
            if( ( is_null( $column ) || $column == $table_column ) &&
                ( is_null( $alias ) || $alias == $table_alias ) )
              unset( $this->column_list[$table][$table_alias] );
        }
      }
    }
  }

  /**
   * Removes all columns which are from a particular table
   * 
   * @param string $table The table to remove
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function remove_column_by_table( $table )
  {
    $this->remove_column( $table, NULL, NULL );
  }

  /**
   * Removes all columns with a particular name
   * 
   * @param string $column The column to remove
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function remove_column_by_column( $column )
  {
    $this->remove_column( NULL, $column, NULL );
  }

  /**
   * Restricts removal to a particular alias
   * 
   * @param string $alias The column alias to remove
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function remove_column_by_alias( $alias )
  {
    $this->remove_column( NULL, NULL, $alias );
  }

  /**
   * Returns the select statement based on this object
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function get_sql()
  {
    if( 0 == strlen( $this->table_name ) )
      throw lib::create( 'exception\runtime',
        'Tried to get SQL from select before table "from" value is set', __METHOD__ );

    // figure out which table to select from
    $main_table = is_null( $this->table_alias ) ? $this->table_name : $this->table_alias;
    
    // figure out the columns
    $columns = array();
    foreach( $this->column_list as $table => $column_details )
    {
      // add the table prefix (if possible)
      $base_column = 0 == strlen( $table ) ? $main_table : $table;
      $base_column .= '.';

      // now add the alias or table.column to the list of columns
      foreach( $column_details as $alias => $column_name )
        $columns[] = $alias == $column_name
                   ? $base_column.$column_name
                   : sprintf( '%s AS %s', $column_name, $alias );
    }

    $table = is_null( $this->table_alias )
           ? $this->table_name
           : sprintf( '%s AS %s', $this->table_name, $this->table_alias );
    return sprintf( 'SELECT %s FROM %s', join( ',', $columns ), $table );
  }

  /**
   * The table to select from
   * @var string
   * @access protected
   */
  protected $table_name = '';

  /**
   * The alias to use for the table to select from
   * @var string
   * @access protected
   */
  protected $table_alias = NULL;

  /**
   * 
   * @var array
   * @access protected
   */
  protected $column_list = array();
}
