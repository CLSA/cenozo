<?php
/**
 * modifier.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $table The table to join to.
   * @param modifier $modifier The modifier containing a where statement that defines how the
   *        join is made.
   * @param string $type The type of join to use.  May be blank or include inner, cross, straight,
   *        left, left outer, right or right outer
   * @param array(string) $columns An array of column names in the adjoined table which should be
   *        added to select statements using this modifier
   * @throws exception\argument
   * @access public
   */
  public function join_modifier( $table, $modifier, $type = '', $columns = array() )
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

    $this->join_list[] = array( 'table' => $table,
                                'modifier' => $modifier,
                                'type' => strtoupper( $type ),
                                'columns' => $columns );
  }

  /**
   * A convenience join method where the left and right columns can be defined and are made
   * to be equal to each other.
   * @param string $table The table to join to.
   * @param string $on_left The left column of the join rule.
   * @param string $on_right The right column of the join rule.
   * @param string $type The type of join to use.  May be blank or include inner, cross, straight,
   *                     left, left outer, right or right outer
   * @throws exception\argument
   * @access public
   */
  public function join( $table, $on_left, $on_right, $type = '', $columns = array() )
  {
    $on_mod = new static();
    $on_mod->where( $on_left, '=', $on_right, false );
    $this->join_modifier( $table, $on_mod, $type, $columns );
  }

  /**
   * A convenience left join method.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $table The table to join to.
   * @param modifier $modifier The modifier containing a where statement that defines how the
   *                           join is made.
   * @throws exception\argument
   * @access public
   */
  public function left_join_modifier( $table, $modifier, $columns = array() )
  {
    $this->join_modifier( $table, $modifier, 'left', $columns );
  }

  /**
   * A convenience left join method.
   * @param string $table The table to join to.
   * @param string $on_left The left column of the join rule.
   * @param string $on_right The right column of the join rule.
   * @throws exception\argument
   * @access public
   */
  public function left_join( $table, $on_left, $on_right, $columns = array() )
  {
    $this->join( $table, $on_left, $on_right, 'left', $columns );
  }

  /**
   * A convenience right join method.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $table The table to join to.
   * @param modifier $modifier The modifier containing a where statement that defines how the
   *                           join is made.
   * @throws exception\argument
   * @access public
   */
  public function right_join_modifier( $table, $modifier, $columns = array() )
  {
    $this->join_modifier( $table, $modifier, 'right', $columns );
  }

  /**
   * A convenience right join method.
   * @param string $table The table to join to.
   * @param string $on_left The left column of the join rule.
   * @param string $on_right The right column of the join rule.
   * @throws exception\argument
   * @access public
   */
  public function right_join( $table, $on_left, $on_right, $columns = array() )
  {
    $this->join( $table, $on_left, $on_right, 'right', $columns );
  }

  /**
   * A convenience cross join method.
   * @param string $table The table to join to.
   * @param modifier $modifier Unlike other join types this can be left NULL
   * @throws exception\argument
   * @access public
   */
  public function cross_join_modifier( $table, $modifier = NULL, $columns = array() )
  {
    $this->join( $table, $modifier, 'cross', $columns );
  }

  /**
   * A convenience cross join method.
   * @param string $table The table to join to.
   * @param string $on_left The left column of the join rule.
   * @param string $on_right The right column of the join rule.
   * @throws exception\argument
   * @access public
   */
  public function cross_join( $table, $on_left, $on_right, $columns = array() )
  {
    $this->join( $table, $on_left, $on_right, 'cross', $columns );
  }

  /**
   * A convenience inner join method.
   * @param string $table The table to join to.
   * @param modifier $modifier Unlike other join types this can be left NULL
   * @throws exception\argument
   * @access public
   */
  public function inner_join( $table, $modifier = NULL, $columns = array() )
  {
    $this->join( $table, $modifier, 'inner', $columns );
  }

  /**
   * Add a where statement to the modifier.
   * 
   * This method appends where clauses onto the end of already existing where clauses.
   * @author Patrick Emond <emondpd@mcmaster.ca>
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

    if( is_array( $value ) && 0 == count( $value ) )
      throw lib::create( 'exception\argument', 'value', $value, __METHOD__ );

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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param boolean $open Whether to open or close a bracket
   * @param boolean $or Whether to logically "or" the contents of the bracket
   *        (default is false, which means "and").  This is ignored when closing brackets.
   * @access public
   */
  public function where_bracket( $open, $or = false )
  {
    $this->where_list[] = array( 'bracket' => $open,
                                 'or' => $or );
  }

  /**
   * Add a group by statement to the modifier.
   * 
   * This method appends group by clauses onto the end of already existing group by clauses.
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * Add a having statement to the modifier.
   * 
   * This method appends having clauses onto the end of already existing having clauses.
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param boolean $open Whether to open or close a bracket
   * @param boolean $or Whether to logically "or" the contents of the bracket
   *        (default is false, which means "and").  This is ignored when closing brackets.
   * @access public
   */
  public function having_bracket( $open, $or = false )
  {
    $this->having_list[] = array( 'bracket' => $open,
                                 'or' => $or );
  }

  /**
   * Adds an order statement to the modifier.
   * 
   * This method appends order clauses onto the end of already existing order clauses.
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return int
   * @access public
   */
  public function get_offset()
  {
    return $this->offset;
  }
  
  /**
   * Returns whether the modifier has a certain table in its join clauses.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $table The table to search for.
   * @return boolean
   * @access public
   */
  public function has_join( $table )
  {
    foreach( $this->join_list as $join )
      if( array_key_exists( 'table', $join ) &&
          $table == $join['table'] ) return true;
    return false;
  }

  /**
   * Returns whether the modifier has a certain column in its where clauses.
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $column The column to search for.
   * @return boolean
   * @access public
   */
  public function has_group( $column )
  {
    return array_key_exists( $column, $this->group_list );
  }

  /**
   * Returns whether the modifier has a certain column in its having clauses.
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $column The column to search for.
   * @return boolean
   * @access public
   */
  public function has_order( $column )
  {
    return array_key_exists( $column, $this->order_list );
  }
  
  /**
   * Get an array of where clauses.
   * 
   * Each element contains an associative array where the indeces 'value' and 'format' contain
   * the column's value and whether to format the value, respectively.
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * Changes the column name of all where statements of a given name
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $old The name of the column to change
   * @param string $new The name to change the column to
   * @access public
   */
  public function change_where_column( $old, $new )
  {
    foreach( $this->where_list as $index => $where )
      if( array_key_exists( 'column', $where ) && $old == $where['column'] )
         $this->where_list[$index]['column'] = $new;
  }

  /**
   * Changes the column name of all group statements of a given name
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $old The name of the column to change
   * @param string $new The name to change the column to
   * @access public
   */
  public function change_group_column( $old, $new )
  {
    foreach( $this->group_list as $index => $group )
      if( $old == $group ) $this->group_list[$index] = $new;
  }

  /**
   * Changes the column name of all having statements of a given name
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $old The name of the column to change
   * @param string $new The name to change the column to
   * @access public
   */
  public function change_having_column( $old, $new )
  {
    foreach( $this->having_list as $index => $having )
      if( array_key_exists( 'column', $having ) && $old == $having['column'] )
         $this->having_list[$index]['column'] = $new;
  }

  /**
   * Changes the column name of all order statements of a given name
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $old The name of the column to change
   * @param string $new The name to change the column to
   * @access public
   */
  public function change_order_column( $old, $new )
  {
    $keys = array_keys( $this->order_list );
    foreach( $keys as $index => $key ) if( $old == $key ) $keys[$index] = $new;
    $this->order_list = array_combine( $keys, array_values( $this->order_list ) );
  }

  /**
   * Returns the modifier as an SQL statement (same as calling each individual get_*() method.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param boolean $appending Whether this modifier is being appended to an existing where clause
   * @return string
   * @access public
   */
  public function get_sql( $appending = false )
  {
    return sprintf(
      '%s %s %s %s %s %s',
      $appending ? '' : $this->get_join(),
      $this->get_where( $appending ),
      $this->get_group(),
      $this->get_having(),
      $this->get_order(),
      is_null( $this->limit ) ? '' : sprintf( 'LIMIT %d OFFSET %d', $this->limit, $this->offset ) );
  }

  /**
   * Returns an SQL join statement.
   * 
   * This method should only be called by a record class and only after all modifications
   * have been set.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_join()
  {
    $sql = '';
    foreach( $this->join_list as $join )
    {
      $type = sprintf( '%s%sJOIN', $join['type'], 'STRAIGHT' == $join['type'] ? '_' : ' ' );
      $on_clause = $join['modifier']->get_where( true );
      // remove the " AND " at the beginning of the appended where clause
      $on_clause = preg_replace( '/^ AND /', '', $on_clause );

      $sql .= sprintf( '%s %s ON %s ',
                       $type,
                       $join['table'],
                       $on_clause );
    }

    return $sql;
  }

  /**
   * Returns additional SQL columns to select from all join statements
   * 
   * This method should only be called by a record class and only after all modifications
   * have been set.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_join_columns()
  {
    $first = true;
    $sql = '';
    foreach( $this->join_list as $join )
    {
      foreach( $join['columns'] as $column )
      {
        $sql .= sprintf( '%s%s.%s AS `%s__%s`',
                         $first ? '' : ', ',
                         $join['table'],
                         $column,
                         $join['table'],
                         $column );
        if( $first ) $first = false;
      }
    }

    return $sql;
  }

  /**
   * Returns an SQL where statement.
   * 
   * This method should only be called by a record class and only after all modifications
   * have been set.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param boolean $appending Whether this modifier is being appended to an existing where clause
   * @return string
   * @access public
   */
  public function get_where( $appending = false )
  {
    $db = lib::create( 'business\session' )->get_database();

    $util_class_name = lib::get_class_name( 'util' );
    $database_class_name = lib::get_class_name( 'database\database' );
    $sql = '';
    $first_item = true;
    $last_open_bracket = false;
    foreach( $this->where_list as $where )
    {
      $statement = '';

      // check if this is a bracket
      if( array_key_exists( 'bracket', $where ) )
      {
        $statement = $where['bracket'] ? '(' : ')';
      }
      else
      {
        $convert_time = $database_class_name::is_time_column( $where['column'] );
        $convert_datetime = $database_class_name::is_datetime_column( $where['column'] );

        if( 'IN' == $where['operator'] || 'NOT IN' == $where['operator'] )
        {
          if( is_array( $where['value'] ) )
          {
            $first_value = true;
            foreach( $where['value'] as $value )
            {
              if( $where['format'] )
              {
                if( $convert_time )
                  $value = $util_class_name::to_server_datetime( $value, 'H:i:s' );
                else if( $convert_datetime )
                  $value = $util_class_name::to_server_datetime( $value );
                $value = $db->format_string( $value );
              }

              $statement .= $first_value
                        ? sprintf( '%s %s( ', $where['column'], $where['operator'] )
                        : ', ';
              $statement .= $value;
              $first_value = false;
            }
            $statement .= ' )';
          }
          else
          {
            $value = $where['value'];
            if( $where['format'] )
            {
              if( $convert_time ) $value = $util_class_name::to_server_datetime( $value, 'H:i:s' );
              else if( $convert_datetime ) $value = $util_class_name::to_server_datetime( $value );
              $value = $db->format_string( $value );
            }

            $statement = sprintf( '%s %s( %s )',
                                $where['column'],
                                $where['operator'],
                                $value );
          }
        }
        else
        {
          $value = $where['value'];
          if( $where['format'] )
          {
            if( $convert_time ) $value = $util_class_name::to_server_datetime( $value, 'H:i:s' );
            else if( $convert_datetime ) $value = $util_class_name::to_server_datetime( $value );
            $value = $db->format_string( $value );
          }
          
          if( 'NULL' == $value )
          {
            if( '=' == $where['operator'] ) $statement = $where['column'].' IS NULL';
            else if( '!=' == $where['operator'] ) $statement = $where['column'].' IS NOT NULL';
            else log::err(
                   'Tried to compare to NULL value with "'.$where['operator'].'" operator.' );
          }
          else
          {
            $statement = sprintf( '%s %s %s',
                                $where['column'],
                                $where['operator'],
                                $value );
          }
        }
      }
      
      $logic_type = $where['or'] ? ' OR' : ' AND';
      if( ( !$first_item || $appending ) &&
          ')' != $statement && !$last_open_bracket ) $sql .= $logic_type;
      $sql .= ' '.$statement;
      $first_item = false;
      $last_open_bracket = '(' == $statement;
    }

    return ( $appending || 0 == strlen( $sql ) ? '' : 'WHERE ' ).$sql;
  }
  
  /**
   * Returns an SQL group statement.
   * 
   * This method should only be called by a record class and only after all modifications
   * have been set.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_group()
  {
    $sql = '';
    $first = true;
    foreach( $this->group_list as $column )
    {
      $sql .= sprintf( '%s %s',
                       $first ? 'GROUP BY' : ',',
                       $column );
      $first = false;
    }

    return $sql;
  }
  
  /**
   * Returns an SQL having statement.
   * 
   * This method should only be called by a record class and only after all modifications
   * have been set.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param boolean $appending Whether this modifier is being appended to an existing having clause
   * @return string
   * @access public
   */
  public function get_having( $appending = false )
  {
    $db = lib::create( 'business\session' )->get_database();

    $util_class_name = lib::get_class_name( 'util' );
    $database_class_name = lib::get_class_name( 'database\database' );
    $sql = '';
    $first_item = true;
    $last_open_bracket = false;
    foreach( $this->having_list as $having )
    {
      $statement = '';

      // check if this is a bracket
      if( array_key_exists( 'bracket', $having ) )
      {
        $statement = $having['bracket'] ? '(' : ')';
      }
      else
      {
        $convert_time = $database_class_name::is_time_column( $having['column'] );
        $convert_datetime = $database_class_name::is_datetime_column( $having['column'] );

        if( 'IN' == $having['operator'] || 'NOT IN' == $having['operator'] )
        {
          if( is_array( $having['value'] ) )
          {
            $first_value = true;
            foreach( $having['value'] as $value )
            {
              if( $having['format'] )
              {
                if( $convert_time )
                  $value = $util_class_name::to_server_datetime( $value, 'H:i:s' );
                else if( $convert_datetime )
                  $value = $util_class_name::to_server_datetime( $value );
                $value = $db->format_string( $value );
              }

              $statement .= $first_value
                        ? sprintf( '%s %s( ', $having['column'], $having['operator'] )
                        : ', ';
              $statement .= $value;
              $first_value = false;
            }
            $statement .= ' )';
          }
          else
          {
            $value = $having['value'];
            if( $having['format'] )
            {
              if( $convert_time ) $value = $util_class_name::to_server_datetime( $value, 'H:i:s' );
              else if( $convert_datetime ) $value = $util_class_name::to_server_datetime( $value );
              $value = $db->format_string( $value );
            }

            $statement = sprintf( '%s %s( %s )',
                                $having['column'],
                                $having['operator'],
                                $value );
          }
        }
        else
        {
          $value = $having['value'];
          if( $having['format'] )
          {
            if( $convert_time ) $value = $util_class_name::to_server_datetime( $value, 'H:i:s' );
            else if( $convert_datetime ) $value = $util_class_name::to_server_datetime( $value );
            $value = $db->format_string( $value );
          }
          
          if( 'NULL' == $value )
          {
            if( '=' == $having['operator'] ) $statement = $having['column'].' IS NULL';
            else if( '!=' == $having['operator'] ) $statement = $having['column'].' IS NOT NULL';
            else log::err(
                   'Tried to compare to NULL value with "'.$having['operator'].'" operator.' );
          }
          else
          {
            $statement = sprintf( '%s %s %s',
                                $having['column'],
                                $having['operator'],
                                $value );
          }
        }
      }
      
      $logic_type = $having['or'] ? ' OR' : ' AND';
      if( ( !$first_item || $appending ) &&
          ')' != $statement && !$last_open_bracket ) $sql .= $logic_type;
      $sql .= ' '.$statement;
      $first_item = false;
      $last_open_bracket = '(' == $statement;
    }

    return ( $appending || 0 == strlen( $sql ) ? '' : 'HAVING ' ).$sql;
  }
  
  /**
   * Returns an SQL order statement.
   * 
   * This method should only be called by a record class and only after all modifications
   * have been set.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_order()
  {
    $sql = '';
    $first = true;
    foreach( $this->order_list as $column => $value )
    {
      $sql .= sprintf( '%s %s %s',
                       $first ? 'ORDER BY' : ',',
                       $column,
                       $value ? 'DESC' : '' );
      $first = false;
    }

    return $sql;
  }
  
  /**
   * Merges another modifier with this one.  Merging only includes join, where, group, having
   * and order items.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param modifier $modifier
   * @access public
   */
  public function merge( $modifier )
  {
    if( !is_null( $modifier ) )
    {
      foreach( $modifier->join_list as $item ) $this->join_list[] = $item;
      foreach( $modifier->where_list as $item ) $this->where_list[] = $item;
      foreach( $modifier->group_list as $item ) $this->group_list[] = $item;
      foreach( $modifier->having_list as $item ) $this->having_list[] = $item;
      foreach( $modifier->order_list as $item ) $this->order_list[] = $item;
    }
  }

  /**
   * JSON-based modifier expected in the form:
   * {
   *   where:
   *   [
   *     {
   *       bracket: true,
   *       open: true
   *     },
   *     {
   *       column:   <column>
   *       operator: =,!=,<,>,LIKE,NOT LIKE,etc
   *       value:    <value>
   *     },
   *     {
   *       bracket: true,
   *       open: false
   *     },
   *     {
   *       bracket: true,
   *       open: true,
   *       or: true
   *     },
   *     {
   *       column:   <column>
   *       operator: =|!=|<|>|LIKE|NOT LIKE|etc
   *       value:    <value>
   *     },
   *     {
   *       bracket: true,
   *       open: false
   *     }
   *   ],
   *   order:
   *   [
   *     <column>,
   *     { <column>: true|false (whether to sort descending) }
   *   ],
   *   limit: N,
   *   offset: N
   * }
   */
  public static function from_json( $json_string )
  {
    $modifier = lib::create( 'database\modifier' );
    $limit = NULL;
    $offset = NULL;

    $util_class_name = lib::get_class_name( 'util' );
    $json_object = $util_class_name::json_decode( $json_string );
    if( is_object( $json_object ) || is_array( $json_object ) )
    {
      foreach( (array)$json_object as $key => $value )
      {
        if( 'join' == $key )
        {
          // convert a single statement to an array with that statement in it
          if( !is_array( $value ) ) $value = array( $value );
          
          foreach( $value as $join )
          {
            if( array_key_exists( 'table', $join ) &&
                array_key_exists( 'onleft', $join ) &&
                array_key_exists( 'onright', $join ) )
            {
              if( !array_key_exists( 'type', $join ) ) $join->type = 'cross';
              if( !array_key_exists( 'columns', $join ) ) $join->columns = NULL;
              $modifier->join( $join->table, $join->onleft, $join->onright, $join->type, $join->columns );
            }
            else
            {
              throw lib::create( 'exception\runtime', 'Invalid join sub-statement', __METHOD__ );
            }
          }
        }
        if( 'where' == $key )
        {
          // convert a single statement to an array with that statement in it
          if( !is_array( $value ) ) $value = array( $value );
          
          foreach( $value as $where )
          {
            if( array_key_exists( 'bracket', $where ) )
            {
              if( array_key_exists( 'or', $where ) ) $modifier->where_bracket( $where->open, $where->or );
              else $modifier->where_bracket( $where->open );
            }
            else if( array_key_exists( 'column', $where ) &&
                     array_key_exists( 'operator', $where ) &&
                     array_key_exists( 'value', $where ) )
            {
              // sanitize the operator value
              $operator = strtoupper( $where->operator );
              $valid_operator_list = array(
                '=', '<=>', '!=', '<>',
                '<', '<=', '>', '>=',
                'RLIKE', 'NOT RLIKE',
                'IN', 'NOT IN',
                'LIKE', 'NOT LIKE' );
              if( in_array( $operator, $valid_operator_list ) )
              {
                if( array_key_exists( 'or', $where ) )
                  $modifier->where( $where->column, $where->operator, $where->value, $where->or );
                else $modifier->where( $where->column, $where->operator, $where->value );
              }
              else
              {
                throw lib::create( 'exception\runtime', 'Invalid where operator', __METHOD__ );
              }
            }
            else
            {
              throw lib::create( 'exception\runtime', 'Invalid where sub-statement', __METHOD__ );
            }
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
              $array = (array)$val;
              $modifier->order( key( $array ), current( $array ) );
            }
            else
            {
              throw lib::create( 'exception\runtime', 'Invalid order statement', __METHOD__ );
            }
          }
        }
        else if( 'limit' == $key )
        {
          if( $util_class_name::string_matches_int( $value ) && 0 < $value ) $limit = $value;
          else
          {
            throw lib::create( 'exception\runtime', 'Invalid limit', __METHOD__ );
          }
        }
        else if( 'offset' == $key )
        {
          if( $util_class_name::string_matches_int( $value ) && 0 <= $value ) $offset = $value;
          else
          {
            throw lib::create( 'exception\runtime', 'Invalid offset', __METHOD__ );
          }
        }
      }

      $modifier->limit( $limit );
      if( !is_null( $offset ) ) $modifier->offset( $offset );
    }
    else
    {
      throw lib::create( 'exception\runtime', 'Invalid format', __METHOD__ );
    }

    return $modifier;
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
}
