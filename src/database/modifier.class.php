<?php
/**
 * modifier.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * This class is used to modify an SQL select statement.
 * 
 * To use this class create an instance, set whichever modifiers are needed then pass it to
 * select-like methods to limit/group/order/etc the query.
 */
class modifier extends \cenozo\base_object
{
  /**
   * Add a join statement to the modifier.
   * 
   * This method appends join clauses onto the end of already existing join clauses.
   * @param string $table The table to join to.
   * @param modifier $modifier The modifier containing a where statement that defines how the
   *        join is made.
   * @param string $type The type of join to use.  May be blank or include inner, cross, straight,
   *        left, left outer, right or right outer
   * @param string $alias The alias of the table (optional)
   * @param boolean $prepend Whether to prepend instead of append the join to the existing list
   * @throws exception\argument
   * @access public
   */
  public function join_modifier( $table, $modifier, $type = '', $alias = NULL, $prepend = false )
  {
    $type = strtoupper( $type );

    if( !is_string( $table ) || 0 == strlen( $table ) )
      throw lib::create( 'exception\argument', 'table', $column, __METHOD__ );

    // don't allow null modifiers unless this is a cross or inner join
    if( 'CROSS' != $type &&
        'INNER' != $type &&
        ( is_null( $modifier ) ||
          false === strpos( get_class( $modifier ), 'database\modifier' ) ) )
      throw lib::create( 'exception\argument', 'modifier', $modifier, __METHOD__ );

    if( !is_string( $type ) )
      throw lib::create( 'exception\argument', 'type', $type, __METHOD__ );
    if( !is_null( $alias ) && !is_string( $alias ) )
      throw lib::create( 'exception\argument', 'alias', $alias, __METHOD__ );
    if( !is_bool( $prepend ) )
      throw lib::create( 'exception\argument', 'prepend', $prepend, __METHOD__ );

    $valid_types = array(
      '',
      'INNER',
      'CROSS',
      'STRAIGHT',
      'LEFT',
      'LEFT OUTER',
      'RIGHT',
      'RIGHT OUTER' );
    if( !is_string( $table) || !in_array( $type, $valid_types ) )
      throw lib::create( 'exception\argument', 'type', $type, __METHOD__ );

    // index the join under the table's alias (or the table name if there is none)
    if( is_null( $alias ) ) $alias = $table;

    // replace existing joins (because order matters)
    if( array_key_exists( $alias, $this->join_list ) ) unset( $this->join_list[$alias] );

    $join = array( $alias => array( 'table' => $table,
                                    'modifier' => $modifier,
                                    'type' => strtoupper( $type ) ) );

    if( $prepend ) $this->join_list = array_merge( $join, $this->join_list );
    else $this->join_list = array_merge( $this->join_list, $join );
  }

  /**
   * A convenience join method where the left and right columns can be defined and are made
   * to be equal to each other.
   * @param string $table The table to join to.
   * @param string $on_left The left column of the join rule.
   * @param string $on_right The right column of the join rule.
   * @param string $type The type of join to use.  May be blank or include inner, cross, straight,
   *                     left, left outer, right or right outer
   * @param string $alias The alias of the table (optional)
   * @param boolean $prepend Whether to prepend instead of append the join to the existing list
   * @throws exception\argument
   * @access public
   */
  public function join( $table, $on_left, $on_right, $type = '', $alias = NULL, $prepend = false )
  {
    $on_mod = new static();
    $on_mod->where( $on_left, '=', $on_right, false );
    $this->join_modifier( $table, $on_mod, $type, $alias, $prepend );
  }

  /**
   * A convenience left join method.
   * @param string $table The table to join to.
   * @param string $on_left The left column of the join rule.
   * @param string $on_right The right column of the join rule.
   * @param string $alias The alias of the table (optional)
   * @param boolean $prepend Whether to prepend instead of append the join to the existing list
   * @throws exception\argument
   * @access public
   */
  public function left_join( $table, $on_left, $on_right, $alias = NULL, $prepend = false )
  {
    $this->join( $table, $on_left, $on_right, 'left', $alias, $prepend );
  }

  /**
   * A convenience right join method.
   * @param string $table The table to join to.
   * @param string $on_left The left column of the join rule.
   * @param string $on_right The right column of the join rule.
   * @param string $alias The alias of the table (optional)
   * @param boolean $prepend Whether to prepend instead of append the join to the existing list
   * @throws exception\argument
   * @access public
   */
  public function right_join( $table, $on_left, $on_right, $alias = NULL, $prepend = false )
  {
    $this->join( $table, $on_left, $on_right, 'right', $alias, $prepend );
  }

  /**
   * A convenience cross join method.
   * @param string $table The table to join to.
   * @param string $on_left The left column of the join rule.
   * @param string $on_right The right column of the join rule.
   * @param string $alias The alias of the table (optional)
   * @param boolean $prepend Whether to prepend instead of append the join to the existing list
   * @throws exception\argument
   * @access public
   */
  public function cross_join( $table, $on_left, $on_right, $alias = NULL, $prepend = false )
  {
    $this->join( $table, $on_left, $on_right, 'cross', $alias, $prepend );
  }

  /**
   * A convenience inner join method.
   * @param string $table The table to join to.
   * @param modifier $modifier Unlike other join types this can be left NULL
   * @param string $alias The alias of the table (optional)
   * @param boolean $prepend Whether to prepend instead of append the join to the existing list
   * @throws exception\argument
   * @access public
   */
  public function inner_join( $table, $modifier = NULL, $alias = NULL, $prepend = false )
  {
    $this->join_modifier( $table, $modifier, 'inner', $alias, $prepend );
  }

  /**
   * Puts brackets around the entire where statement
   * 
   * This is useful when wanting to add a where statement without affecting any existing OR statements.
   * If there are less than two existing where statements then this does nothing
   * @access public
   */
  public function wrap_where()
  {
    if( 1 < count( $this->where_list ) )
    {
      array_unshift( $this->where_list, array( 'bracket' => true, 'or' => false, 'not' => false ) );
      array_push( $this->where_list, array( 'bracket' => false, 'or' => false, 'not' => false ) );
    }
  }

  /**
   * Add a where statement to the modifier.
   * 
   * This method appends where clauses onto the end of already existing where clauses.
   * @param string $column The column to restrict.
   * @param string $operator Specify which comparison operator to use.  Examples include 'in',
   *                         for the SQL IN() function, 'like' for the SQL LIKE() function, '=',
   *                         '>', '>=', '<=', '<', etc.
   *                         When this is set to 'in' $value may be an array of values.
   * @param mixed $value The value to restrict to (will be sql-escaped, quotes not necessary).
   * @param boolean $format Set whether to format the $value argument.
   *                        This should only be set to false when $value is the name of a column
   *                        or a pre-formatted function, etc.
   * @param boolean $or Whether to logically "or" the clause (default is false, which means "and")
   * @throws exception\argument
   * @access public
   */
  public function where(
    $column, $operator, $value, $format = true, $or = false )
  {
    if( !is_string( $column ) || 0 == strlen( $column ) )
      throw lib::create( 'exception\argument', 'column', $column, __METHOD__ );

    $this->where_list[] = array( 'column' => $column,
                                 'operator' => strtoupper( $operator ),
                                 'value' => $value,
                                 'format' => $format,
                                 'or' => $or );
  }

  /**
   * Add where statement which will be "or" combined to the modifier.
   * 
   * This is a convenience method which makes where() calls more readable.
   * @param string $column The column to restrict.
   * @param string $operator Specify which comparison operator to use.  Examples include 'in',
   *                         for the SQL IN() function, 'like' for the SQL LIKE() function, '=',
   *                         '>', '>=', '<=', '<', etc.
   *                         When this is set to 'in' $value may be an array of values.
   * @param mixed $value The value to restrict to (will be sql-escaped, quotes not necessary).
   * @param boolean $format Set whether to format the $value argument.
   *                         This should only be set to false when $value is the name of a column
   *                         or a pre-formatted function, etc.
   * @access public
   */
  public function or_where( $column, $operator, $value, $format = true )
  {
    $this->where( $column, $operator, $value, $format, true );
  }

  /**
   * Add a bracket to a where statement
   * 
   * @param boolean $open Whether to open or close a bracket
   * @param boolean $or Whether to logically "or" the contents of the bracket
   *        (default is false, which means "and").  This is ignored when closing brackets.
   * @param boolean $not Whether to logically "not" the contents of the bracket
   *        (default is to not include the "not" statement).  This is ignored when closing brackets.
   * @access public
   */
  public function where_bracket( $open, $or = false, $not = false )
  {
    $this->where_list[] = array( 'bracket' => $open,
                                 'or' => $or,
                                 'not' => $not );
  }

  /**
   * Add a group by statement to the modifier.
   * 
   * This method appends group by clauses onto the end of already existing group by clauses.
   * @param string $column The column to group by.
   * @throws exception\argument
   * @access public
   */
  public function group( $column )
  {
    if( !is_string( $column ) || 0 == strlen( $column ) )
      throw lib::create( 'exception\argument', 'column', $column, __METHOD__ );

    $this->group_list[] = $column;
  }

  /**
   * Returns whether or not to rollup grouped data
   * 
   * @return boolean
   * @access public
   */
  public function get_rollup()
  {
    return $this->rollup;
  }

  /**
   * Sets whether or not to rollup grouped data
   * 
   * @param boolean $rollup
   * @access public
   */
  public function set_rollup( $rollup )
  {
    $this->rollup = $rollup;
  }

  /**
   * Add a having statement to the modifier.
   * 
   * This method appends having clauses onto the end of already existing having clauses.
   * @param string $column The column to restrict.
   * @param string $operator Specify which comparison operator to use.  Examples include 'in',
   *                         for the SQL IN() function, 'like' for the SQL LIKE() function, '=',
   *                         '>', '>=', '<=', '<', etc.
   *                         When this is set to 'in' $value may be an array of values.
   * @param mixed $value The value to restrict to (will be sql-escaped, quotes not necessary).
   * @param boolean $format Set whether to format the $value argument.
   *                        This should only be set to false when $value is the name of a column
   *                        or a pre-formatted function, etc.
   * @param boolean $or Whether to logically "or" the clause (default is false, which means "and")
   * @throws exception\argument
   * @access public
   */
  public function having(
    $column, $operator, $value, $format = true, $or = false )
  {
    if( !is_string( $column ) || 0 == strlen( $column ) )
      throw lib::create( 'exception\argument', 'column', $column, __METHOD__ );

    if( is_array( $value ) && 0 == count( $value ) )
      throw lib::create( 'exception\argument', 'value', $value, __METHOD__ );

    $this->having_list[] = array( 'column' => $column,
                                 'operator' => strtoupper( $operator ),
                                 'value' => $value,
                                 'format' => $format,
                                 'or' => $or );
  }

  /**
   * Add having statement which will be "or" combined to the modifier.
   * 
   * This is a convenience method which makes having() calls more readable.
   * @param string $column The column to restrict.
   * @param string $operator Specify which comparison operator to use.  Examples include 'in',
   *                         for the SQL IN() function, 'like' for the SQL LIKE() function, '=',
   *                         '>', '>=', '<=', '<', etc.
   *                         When this is set to 'in' $value may be an array of values.
   * @param mixed $value The value to restrict to (will be sql-escaped, quotes not necessary).
   * @param boolean $format Set whether to format the $value argument.
   *                         This should only be set to false when $value is the name of a column
   *                         or a pre-formatted function, etc.
   * @access public
   */
  public function or_having( $column, $operator, $value, $format = true )
  {
    $this->having( $column, $operator, $value, $format, true );
  }

  /**
   * Add a bracket to a having statement
   * 
   * @param boolean $open Whether to open or close a bracket
   * @param boolean $or Whether to logically "or" the contents of the bracket
   *        (default is false, which means "and").  This is ignored when closing brackets.
   * @param boolean $not Whether to logically "not" the contents of the bracket
   *        (default is to not include the "not" statement).  This is ignored when closing brackets.
   * @access public
   */
  public function having_bracket( $open, $or = false, $not = false )
  {
    $this->having_list[] = array( 'bracket' => $open,
                                 'or' => $or,
                                 'not' => $not );
  }

  /**
   * Adds an order statement to the modifier.
   * 
   * This method appends order clauses onto the end of already existing order clauses.
   * @param string $column The column to order by.
   * @param boolean $desc Whether to sort in descending order.
   * @throws exception\argument
   * @access public
   */
  public function order( $column, $desc = false )
  {
    if( !is_string( $column ) || 0 == strlen( $column ) )
      throw lib::create( 'exception\argument', 'column', $column, __METHOD__ );

    $this->order_list[$column] = $desc;
  }

  /**
   * Add order descending statement to the modifier.
   * 
   * This is a convenience method which makes order() calls more readable.
   * @param string $column The column to order descending by.
   * @throws exception\argument
   * @access public
   */
  public function order_desc( $column )
  {
    $this->order( $column, true );
  }

  /**
   * Sets a limit to how many rows are returned (set to NULL for no limit).
   * 
   * @param int $limit The number of rows to limit by.
   * @throws exception\argument
   * @access public
   */
  public function limit( $limit )
  {
    if( !is_null( $limit ) && 0 > $limit )
      throw lib::create( 'exception\argument', 'limit', $limit, __METHOD__ );

    $this->limit = $limit;
  }

  /**
   * Sets the offset to use when returning rows.
   * 
   * @param int $offset The offset to begin the selection.
   * @throws exception\argument
   * @access public
   */
  public function offset( $offset = 0 )
  {
    if( 0 > $offset ) throw lib::create( 'exception\argument', 'offset', $offset, __METHOD__ );

    $this->offset = $offset;
  }

  /**
   * Returns the modifier's limit count value (NULL if there is no limit)
   * 
   * @return int
   * @access public
   */
  public function get_limit()
  {
    return $this->limit;
  }

  /**
   * Returns the modifier's limit offset value (0 if there is no offset)
   * 
   * @return int
   * @access public
   */
  public function get_offset()
  {
    return $this->offset;
  }

  /**
   * Returns the number of where statements in the modifier
   * 
   * @return int
   * @access public
   */
  public function get_where_count()
  {
    return count( $this->where_list );
  }

  /**
   * Returns the number of join statements in the modifier
   * 
   * @return int
   * @access public
   */
  public function get_join_count()
  {
    return count( $this->join_list );
  }

  /**
   * Returns the number of group statements in the modifier
   * 
   * @return int
   * @access public
   */
  public function get_group_count()
  {
    return count( $this->group_list );
  }

  /**
   * Returns the number of having statements in the modifier
   * 
   * @return int
   * @access public
   */
  public function get_having_count()
  {
    return count( $this->having_list );
  }

  /**
   * Returns the number of order statements in the modifier
   * 
   * @return int
   * @access public
   */
  public function get_order_count()
  {
    return count( $this->order_list );
  }

  /**
   * Returns whether the modifier has a certain table (or alias) in its join clauses.
   * @param string $table The table to search for.
   * @return boolean
   * @access public
   */
  public function has_join( $table )
  {
    return array_key_exists( $table, $this->join_list );
  }

  /**
   * Returns whether the modifier has a certain column in its where clauses.
   * @param string $column The column to search for.
   * @return boolean
   * @access public
   */
  public function has_where( $column )
  {
    foreach( $this->where_list as $where )
      if( array_key_exists( 'column', $where ) &&
          $column == $where['column'] ) return true;
    return false;
  }

  /**
   * Returns whether the modifier has a certain column in its group clauses.
   * @param string $column The column to search for.
   * @return boolean
   * @access public
   */
  public function has_group( $column )
  {
    return in_array( $column, $this->group_list );
  }

  /**
   * Returns whether the modifier has a certain column in its having clauses.
   * @param string $column The column to search for.
   * @return boolean
   * @access public
   */
  public function has_having( $column )
  {
    foreach( $this->having_list as $having )
      if( array_key_exists( 'column', $having ) &&
          $column == $having['column'] ) return true;
    return false;
  }

  /**
   * Returns whether the modifier has a certain column in its order clauses.
   * @param string $column The column to search for.
   * @return boolean
   * @access public
   */
  public function has_order( $column )
  {
    return array_key_exists( $column, $this->order_list );
  }

  /**
   * Returns the natural table name associated with a join (based on an alias)
   * 
   * Any join may be aliased.  This method will return the table name that the alias refers to,
   * or simply the table name if there is no alias (ie: the table name matches the alias name)
   * @return string
   * @access public
   */
  public function get_alias_table( $alias )
  {
    $table = array_key_exists( $alias, $this->join_list ) ? $this->join_list[$alias]['table'] : NULL;

    if( is_null( $table ) )
      log::warning( sprintf( 'Unable to find table for alias "%s" in modifier object', $alias ) );

    return $table;
  }

  /**
   * Get an array of where clauses.
   * 
   * Each element contains an associative array where the indeces 'value' and 'format' contain
   * the column's value and whether to format the value, respectively.
   * @return array
   * @access public
   */
  public function get_where_columns()
  {
    $columns = array();
    foreach( $this->where_list as $where )
    {
      if( array_key_exists( 'column', $where ) )
      {
        // get the first table.name match, or if no match is found leave the string alone
        $matches = array();
        if( 1 == preg_match( '/\w+\.\w+/', $where['column'], $matches ) ) $columns[] = $matches[0];
        else $columns[] = $where['column'];
      }
    }

    return $columns;
  }

  /**
   * Get an array of group clauses.
   * 
   * The returned array is an array of table names.
   * @return array
   * @access public
   */
  public function get_group_columns()
  {
    $columns = array();
    foreach( $this->group_list as $column => $value )
    {
      // get the first table.name match, or if no match if found leave the string alone
      $matches = array();
      if( 1 == preg_match( '/\w+\.\w+/', $column, $matches ) ) $columns[] = $matches[0];
      else $columns[] = $column;
    }

    return $columns;
  }

  /**
   * Get an array of having clauses.
   * 
   * Each element contains an associative array having the indeces 'value' and 'format' contain
   * the column's value and whether to format the value, respectively.
   * @return array
   * @access public
   */
  public function get_having_columns()
  {
    $columns = array();
    foreach( $this->having_list as $having )
    {
      if( array_key_exists( 'column', $having ) )
      {
        // get the first table.name match, or if no match is found leave the string alone
        $matches = array();
        if( 1 == preg_match( '/\w+\.\w+/', $having['column'], $matches ) ) $columns[] = $matches[0];
        else $columns[] = $having['column'];
      }
    }

    return $columns;
  }

  /**
   * Get an array of order clauses.
   * 
   * The returned array is an associative array of "column name" => "descending" values.
   * @return array
   * @access public
   */
  public function get_order_columns()
  {
    $columns = array();
    foreach( $this->order_list as $column => $value )
    {
      // get the first table.name match, or if no match if found leave the string alone
      $matches = array();
      if( 1 == preg_match( '/\w+\.\w+/', $column, $matches ) ) $columns[] = $matches[0];
      else $columns[] = $column;
    }

    return $columns;
  }

  /**
   * Replaces a column in all where, group, having and order statements
   * 
   * @param string $column Which column to replace
   * @param string $replace What to replace the column with
   * @access public
   */
  public function replace_column( $column, $replace )
  {
    $this->replace_where( $column, $replace );
    $this->replace_group( $column, $replace );
    $this->replace_having( $column, $replace );
    $this->replace_order( $column, $replace );
  }

  /**
   * Replaces a where column with something else (useful for aliases)
   * 
   * @param string $column Which column to replace
   * @param string $replace What to replace the column with
   * @access public
   */
  public function replace_where( $column, $replace )
  {
    foreach( $this->where_list as $index => $where )
      if( array_key_exists( 'column', $where ) && $column == $where['column'] )
        $this->where_list[$index]['column'] = $replace;
  }

  /**
   * Replaces a where column with something else (useful for aliases)
   * 
   * @param string $column Which column to replace
   * @param string $replace What to replace the column with
   * @access public
   */
  public function replace_group( $column, $replace )
  {
    foreach( $this->group_list as $index => $group )
      if( $column == $group )
        $this->group_list[$index] = $replace;
  }

  /**
   * Replaces a where column with something else (useful for aliases)
   * 
   * @param string $column Which column to replace
   * @param string $replace What to replace the column with
   * @access public
   */
  public function replace_having( $column, $replace )
  {
    foreach( $this->having_list as $index => $having )
      if( array_key_exists( 'column', $having ) && $column == $having['column'] )
        $this->having_list[$index]['column'] = $replace;
  }

  /**
   * Replaces a where column with something else (useful for aliases)
   * 
   * @param string $column Which column to replace
   * @param string $replace What to replace the column with
   * @access public
   */
  public function replace_order( $column, $replace )
  {
    if( array_key_exists( $column, $this->order_list ) )
    {
      // we must preserve the order of the associative array
      $this->order_list = array_combine(
        array_map(
          function( $key ) use( $column, $replace ) { return $column == $key ? $replace : $key; },
          array_keys( $this->order_list )
        ),
        array_values( $this->order_list )
      );
    }
  }

  /**
   * Removes all join statements to a particular table (or alias)
   * 
   * @param string $table Which table to remove all joins to
   * @access public
   */
  public function remove_join( $table )
  {
    unset( $this->join_list[$table] );
  }

  /**
   * Removes all where statements affecting a particular column
   * 
   * @param string $remove Which column to remove all where statements from the modifier
   * @access public
   */
  public function remove_where( $remove )
  {
    $this->where_list = array_filter( $this->where_list, function( $where ) use( $remove ) {
      return !array_key_exists( 'column', $where ) || $remove != $where['column'];
    } );
  }

  /**
   * Removes all group statements affecting a particular column
   * 
   * @param string $remove Which column to remove all where statements from the modifier
   * @access public
   */
  public function remove_group( $remove )
  {
    $this->group_list = array_filter( $this->group_list, function( $group ) use( $remove ) {
      return $remove != $group;
    } );
  }

  /**
   * Removes all having statements affecting a particular column
   * 
   * @param string $remove Which column to remove all where statements from the modifier
   * @access public
   */
  public function remove_having( $remove )
  {
    $this->having_list = array_filter( $this->having_list, function( $having ) use( $remove ) {
      return !array_key_exists( 'column', $having ) || $remove != $having['column'];
    } );
  }

  /**
   * Removes all order statements affecting a particular column
   * 
   * @param string $remove Which column to remove all where statements from the modifier
   * @access public
   */
  public function remove_order( $remove )
  {
    $this->order_list = array_filter( $this->order_list, function( $order ) use( $remove ) {
      return $remove != $order;
    } );
  }

  /**
   * Returns the modifier as an SQL statement (same as calling each individual get_*() method.
   * 
   * @param boolean $count Whether the modifier is to be used for a single-value COUNT query
   * @param boolean $exclude_join Whether to exclude any joins
   * @return string
   * @access public
   */
  public function get_sql( $count = false, $exclude_join = false )
  {
    $sql = $exclude_join ? '' : $this->get_join();
    if( $where = $this->get_where() ) $sql .= sprintf( "\nWHERE %s", $where );
    if( $group = $this->get_group() ) $sql .= sprintf( "\nGROUP BY %s", $group );
    if( $having = $this->get_having() ) $sql .= sprintf( "\nHAVING %s", $having );
    if( !$count )
    {
      if( $order = $this->get_order() ) $sql .= sprintf( "\nORDER BY %s", $order );
      if( !is_null( $this->limit ) )
        $sql .= sprintf( "\nLIMIT %d OFFSET %d", $this->limit, $this->offset );
    }

    return $sql;
  }

  /**
   * Convenience method
   */
  public function get_sql_without_joins( $count = false )
  {
    return $this->get_sql( $count, true );
  }

  /**
   * Returns an SQL join statement.
   * 
   * This method should only be called by a record class and only after all modifications
   * have been set.
   * @return string
   * @access public
   */
  public function get_join()
  {
    $sql = '';
    foreach( $this->join_list as $alias => $join )
    {
      $prefix = $join['type'];
      if( 0 < strlen( $prefix ) ) $prefix .= 'STRAIGHT' == $prefix ? '_' : ' ';
      $type = sprintf( "\n%sJOIN", $prefix );
      $on_clause = is_null( $join['modifier'] ) ? NULL : $join['modifier']->get_where();
      $table = $join['table'];
      if( preg_match( '/\(.+\)/', str_replace( "\n", ' ', $table ) ) )
      { // table name is sql statement enclosed in (), reformat accordingly
        $lines = [];
        foreach( explode( "\n", $table ) as $line )
        {
          $line = preg_replace( '/^\( *(.+)/', "(\n  $1", $line );
          $line = preg_replace( '/^[^(].*/', '  $0', $line );
          $lines[] = $line;
        }
        $last = count( $lines ) - 1;
        if( preg_match( '/\)/', $lines[$last] ) )
        {
          $lines[$last] = preg_replace( '/ *\)/', "\n)", $lines[$last] );
        }
        $table = implode( "\n", $lines );
      }
      if( $alias != $join['table'] ) $table .= ' AS '.$alias;
      $sql .= is_null( $on_clause )
            ? sprintf( "%s %s ", $type, $table )
            : sprintf( "%s %s\n  ON %s ", $type, $table, $on_clause );
    }

    return $sql;
  }

  /**
   * Internally generates where/having sql statements
   * 
   * @param boolean $having Whether to return having or where statement.
   * @return string
   * @access private
   */
  private function get_where_or_having( $list )
  {
    $db = lib::create( 'business\session' )->get_database();

    $util_class_name = lib::get_class_name( 'util' );
    $database_class_name = lib::get_class_name( 'database\database' );
    $sql = '';
    $first_item = true;
    $last_open_bracket = false;
    foreach( $list as $item )
    {
      $open_bracket = NULL;
      $statement = '';

      // check if this is a bracket
      if( array_key_exists( 'bracket', $item ) )
      {
        $open_bracket = $item['bracket'];
        $statement = $open_bracket ?
          ( ( $item['not'] ? 'NOT ' : '' ).'(' ) :
          ( $last_open_bracket ? 'true )' : ')' );
      }
      else
      {
        $is_datetime = $database_class_name::is_datetime_column( $item['column'] );
        $is_date = $database_class_name::is_date_column( $item['column'] );
        $is_time = $database_class_name::is_time_column( $item['column'] );

        if( 'IN' == $item['operator'] || 'NOT IN' == $item['operator'] )
        {
          if( is_array( $item['value'] ) )
          {
            $first_value = true;
            foreach( $item['value'] as $value )
            {
              if( $item['format'] )
              {
                if( $is_datetime ) $value = $db->format_datetime( $value );
                else if( $is_date ) $value = $db->format_date( $value );
                else if( $is_time ) $value = $db->format_time( $value );
                else $value = $db->format_string( $value );
              }

              $statement .= $first_value ?
                sprintf( '%s %s( ', $item['column'], $item['operator'] ) : ', ';
              $statement .= $value;
              $first_value = false;
            }

            if( $first_value )
            {
              // if there are no values then make an empty list
              $statement .= sprintf(
                '%s %s( SELECT * FROM( SELECT 0 ) AS temp_empty_list WHERE 0 )',
                $item['column'],
                $item['operator']
              );
            }
            else $statement .= ' )';
          }
          else
          {
            $value = $item['value'];
            if( $item['format'] )
            {
              if( $is_datetime ) $value = $db->format_datetime( $value );
              else if( $is_date ) $value = $db->format_date( $value );
              else if( $is_time ) $value = $db->format_time( $value );
              else $value = $db->format_string( $value );
            }

            $statement = sprintf(
              '%s %s( %s )',
              $item['column'],
              $item['operator'],
              $value
            );
          }
        }
        else if( preg_match( '/LIKE/', $item['operator'] ) )
        {
          $statement = sprintf(
            '%s %s %s',
            $item['column'],
            $item['operator'],
            $item['format'] ? $db->format_string( $item['value'] ) : $item['value']
          );
        }
        else
        {
          $value = $item['value'];
          if( $item['format'] )
          {
            if( $is_datetime ) $value = $db->format_datetime( $value );
            else if( $is_date ) $value = $db->format_date( $value );
            else if( $is_time ) $value = $db->format_time( $value );
            else $value = $db->format_string( $value );
          }

          if( 'NULL' == $value )
          {
            if( '=' == $item['operator'] ) $statement = $item['column'].' IS NULL';
            else if( '!=' == $item['operator'] || '<>' == $item['operator'] )
              $statement = $item['column'].' IS NOT NULL';
            else if( '<=>' == $item['operator'] ) $statement = $item['column'].' <=> NULL';
            else log::error( 'Tried to compare to NULL value with "'.$item['operator'].'" operator.' );
          }
          else
          {
            $statement = sprintf(
              '%s %s %s',
              $item['column'],
              $item['operator'],
              $value
            );
          }
        }
      }

      $logic_type = $item['or'] ? 'OR' : 'AND';
      // only show the logic type if...
      $show_logic =
        !$first_item && // this isn't the first item
        !( false === $open_bracket ) && // we're not closing a bracket
        !$last_open_bracket; // we didn't just open a bracket
      if( !$first_item ) $sql .= "\n  ";
      $sql .= ( $show_logic ? $logic_type.' ' : '' ).$statement;
      $first_item = false;
      $last_open_bracket = true === $open_bracket;
    }

    return $sql;
  }

  /**
   * Returns an SQL group statement.
   * 
   * This method should only be called by a record class and only after all modifications
   * have been set.
   * @return string
   * @access public
   */
  public function get_group()
  {
    $sql = '';
    $first = true;
    foreach( $this->group_list as $column )
    {
      $sql .= sprintf( "%s%s",
                       $first ? '' : ', ',
                       $column );
      $first = false;
    }

    if( 0 < strlen( $sql ) && $this->rollup ) $sql .= ' WITH ROLLUP';

    return $sql;
  }

  /**
   * Returns an SQL where statement.
   * 
   * This method should only be called by a record class and only after all modifications
   * have been set.
   * @return string
   * @access public
   */
  public function get_where()
  {
    return $this->get_where_or_having( $this->where_list );
  }

  /**
   * Returns an SQL having statement.
   * 
   * This method should only be called by a record class and only after all modifications
   * have been set.
   * @return string
   * @access public
   */
  public function get_having()
  {
    return $this->get_where_or_having( $this->having_list );
  }

  /**
   * Returns an SQL order statement.
   * 
   * This method should only be called by a record class and only after all modifications
   * have been set.
   * @return string
   * @access public
   */
  public function get_order()
  {
    $sql = '';
    $first = true;
    foreach( $this->order_list as $column => $value )
    {
      $sql .= sprintf( '%s%s%s',
                       $first ? '' : ', ',
                       $column,
                       $value ? ' DESC' : '' );
      $first = false;
    }

    return $sql;
  }

  /**
   * Merges another modifier with this one.
   * 
   * Merging only includes join, where, group, having and order items.  Where and having
   * statements are enclosed by brackets.
   * 
   * @param modifier $modifier
   * @access public
   */
  public function merge( $modifier )
  {
    if( !is_null( $modifier ) )
    {
      $this->join_list = array_merge( $this->join_list, $modifier->join_list );
      $this->order_list = array_merge( $this->order_list, $modifier->order_list );
      foreach( $modifier->group_list as $item ) $this->group_list[] = $item;

      if( 0 < count( $modifier->where_list ) )
      {
        $this->where_bracket( true );
        foreach( $modifier->where_list as $item ) $this->where_list[] = $item;
        $this->where_bracket( false );
      }

      if( 0 < count( $modifier->having_list ) )
      {
        $this->having_bracket( true );
        foreach( $modifier->having_list as $item ) $this->having_list[] = $item;
        $this->having_bracket( false );
      }
    }
  }

  /**
   * JSON-based modifier expected in the form:
   * {
   *   join or j:
   *   [
   *     {
   *       table or t:   <table>,
   *       onleft or ol:  <column>,
   *       onright or or: <column>,
   *       type or tp: inner|cross|straight|left|left outer|right|right outer (optional)
   *       alias or a: <string> (optional),
   *       prepend or p: true|false (optional)
   *     }
   *   ],
   *   having|where or h|w:
   *   [
   *     {
   *       bracket or b: true,
   *       open or n: true|false,
   *       or: true|false
   *     },
   *     {
   *       column or c:   <column>
   *       operator or op: =|!=|<|>|LIKE|NOT LIKE|etc
   *       value or v:    <value>
   *     }
   *   ],
   *   order or o:
   *   [
   *     <column>,
   *     { <column>: true|false (whether to sort descending) }
   *   ],
   *   limit or l: N,
   *   offset or off: N
   * }
   */
  public static function from_json( $json_string )
  {
    $util_class_name = lib::get_class_name( 'util' );

    $json_object = static::convert_keys( $util_class_name::json_decode( $json_string ) );

    $modifier = lib::create( 'database\modifier' );
    $limit = NULL;
    $offset = NULL;
    if( is_object( $json_object ) || is_array( $json_object ) )
    {
      foreach( (array) $json_object as $key => $value )
      {
        if( 'join' == $key )
        {
          // convert a statement into an array (for single arguments or objects)
          if( !is_array( $value ) ) $value = array( $value );

          foreach( $value as $join )
          {
            if( property_exists( $join, 'table' ) &&
                property_exists( $join, 'onleft' ) &&
                property_exists( $join, 'onright' ) )
            {
              if( !property_exists( $join, 'type' ) ) $join->type = 'cross';
              if( !property_exists( $join, 'alias' ) ) $join->alias = NULL;
              if( !property_exists( $join, 'prepend' ) ) $join->prepend = false;
              $modifier->join(
                $join->table,
                $join->onleft,
                $join->onright,
                $join->type,
                $join->alias,
                $join->prepend
              );
            }
            else throw lib::create( 'exception\runtime', 'Invalid join sub-statement', __METHOD__ );
          }
        }
        else if( 'having' == $key || 'where' == $key )
        {
          // convert a single statement to an array with that statement in it
          if( !is_array( $value ) ) $value = array( $value );

          foreach( $value as $condition )
          {
            if( property_exists( $condition, 'bracket' ) )
            {
              $or = property_exists( $condition, 'or' ) ? $condition->or : false;
              $method = sprintf( '%s_bracket', $key );
              $modifier->$method( $condition->open, $or );
            }
            else if( property_exists( $condition, 'column' ) &&
                     property_exists( $condition, 'operator' ) &&
                     property_exists( $condition, 'value' ) )
            {
              // sanitize the operator value
              $operator = strtoupper( $condition->operator );
              $valid_operator_list = array(
                '=', '<=>', '!=', '<>',
                '<', '<=', '>', '>=',
                'RLIKE', 'NOT RLIKE',
                'IN', 'NOT IN',
                'LIKE', 'NOT LIKE' );
              if( in_array( $operator, $valid_operator_list ) )
              {
                $or = property_exists( $condition, 'or' ) ? $condition->or : false;
                // here $key is either where or having (using it as a method call)
                $modifier->$key( $condition->column, $condition->operator, $condition->value, true, $or );
              }
              else throw lib::create( 'exception\runtime',
                sprintf( 'Invalid %s operator', $key ), __METHOD__ );
            }
            else throw lib::create( 'exception\runtime',
              sprintf( 'Invalid %s sub-statement', $key ), __METHOD__ );
          }
        }
        else if( 'order' == $key )
        {
          // convert a string to an array with that string in it
          if( is_string( $value ) || is_object( $value ) ) $value = array( $value );

          foreach( $value as $val )
          {
            if( is_string( $val ) ) $modifier->order( $val );
            else if( is_object( $val ) )
            {
              $array = (array) $val;
              $modifier->order( key( $array ), current( $array ) );
            }
            else throw lib::create( 'exception\runtime', 'Invalid order statement', __METHOD__ );
          }
        }
        else if( 'limit' == $key )
        {
          if( $util_class_name::string_matches_int( $value ) && 0 < $value ) $limit = $value;
          else throw lib::create( 'exception\runtime', 'Invalid limit', __METHOD__ );
        }
        else if( 'offset' == $key )
        {
          if( $util_class_name::string_matches_int( $value ) && 0 <= $value ) $offset = $value;
          else throw lib::create( 'exception\runtime', 'Invalid offset', __METHOD__ );
        }
      }

      $modifier->limit( $limit );
      if( !is_null( $offset ) ) $modifier->offset( $offset );
    }
    else throw lib::create( 'exception\runtime', 'Invalid format', __METHOD__ );

    return $modifier;
  }

  /**
   * Converts keys in JSON objects from short to long form
   * @param mixed $object
   * @return mixed
   */
  public static function convert_keys( $object )
  {
    // do nothing to non object/arrays
    if( !is_object( $object ) && !is_array( $object ) ) return $object;

    $new_object = is_object( $object ) ? new \stdClass : [];
    foreach( $object as $key => $value )
    {
      if( 'a' == $key ) $key = 'alias';
      else if( 'b' == $key ) $key = 'bracket';
      else if( 'c' == $key ) $key = 'column';
      else if( 'h' == $key ) $key = 'having';
      else if( 'j' == $key ) $key = 'join';
      else if( 'l' == $key ) $key = 'limit';
      else if( 'n' == $key ) $key = 'open';
      else if( 'o' == $key ) $key = 'order';
      else if( 'off' == $key ) $key = 'offset';
      else if( 'onl' == $key ) $key = 'onleft';
      else if( 'op' == $key ) $key = 'operator';
      else if( 'onr' == $key ) $key = 'onright';
      else if( 'p' == $key ) $key = 'prepend';
      else if( 't' == $key ) $key = 'table';
      else if( 'tp' == $key ) $key = 'type';
      else if( 'v' == $key ) $key = 'value';
      else if( 'w' == $key ) $key = 'where';

      $value = static::convert_keys( $value );
      if( is_object( $new_object ) ) $new_object->$key = $value;
      else $new_object[$key] = $value;
    }

    return $new_object;
  }

  /**
   * Holds all join clauses in an array of associative arrays
   * @var array
   * @access protected
   */
  protected $join_list = array();

  /**
   * Holds all where clauses in an array of associative arrays
   * @var array
   * @access protected
   */
  protected $where_list = array();

  /**
   * Holds all group clauses.
   * @var array( string )
   * @access protected
   */
  protected $group_list = array();

  /**
   * Holds all having clauses in an array of associative arrays
   * @var array
   * @access protected
   */
  protected $having_list = array();

  /**
   * Holds all order clauses.
   * @var array( column => desc )
   * @access protected
   */
  protected $order_list = array();

  /**
   * The row limit value (null if there is no limit)
   * @var int
   * @access protected
   */
  protected $limit = NULL;

  /**
   * The limit offset value.
   * @var int
   * @access protected
   */
  protected $offset = 0;

  /**
   * Whether or not to rollup grouped data
   * @var boolean
   * @access protected
   */
  protected $rollup = false;
}
