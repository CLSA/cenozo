<?php
/**
 * record.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * record: abstract database table object
 *
 * The record class represents tables in the database.  Each table has its own class which
 * extends this class.  Furthermore, each table must have a single 'id' column as its primary key.
 */
abstract class record extends \cenozo\base_object
{
  /**
   * Constructor
   * 
   * The constructor either creates a new object which can then be insert into the database by
   * calling the {@link save} method, or, if an primary key is provided then the row with the
   * requested primary id will be loaded.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param integer $id The primary key for this object.
   * @throws exception\runtime
   * @access public
   */
  public function __construct( $id = NULL )
  {
    $util_class_name = lib::get_class_name( 'util' );

    // now loop through all tables and fill in the default values
    foreach( $this->get_working_table_list() as $table )
    {
      // determine the columns for this table
      $columns = static::db()->get_column_names( $table['name'] );

      if( !is_array( $columns ) || 0 == count( $columns ) )
        throw lib::create( 'exception\runtime', sprintf(
          'No column names returned for table "%s"', $table['name'] ),
          __METHOD__ );

      // set the default value for all columns
      foreach( $columns as $name )
      {
        // If the default is CURRENT_TIMESTAMP, or if there is a DATETIME column by the name
        // 'start_datetime' then make the default the current date and time.
        // Because mysql does not allow setting the default value for a DATETIME column to be
        // NOW() we need to set the default here manually
        $default = static::db()->get_column_default( $table['name'], $name );
        if( 'start_datetime' == $name ||
            ( 'CURRENT_TIMESTAMP' == $default && 'datetime' == $name ) )
        {
          $table['columns'][$name] = $util_class_name::get_datetime_object();
        }
        else
        {
          $table['columns'][$name] = $default;
        }
      }
    }

    if( NULL != $id )
    {
      // make sure this table has an id column as the primary key
      $primary_key_names = static::db()->get_primary_key( static::get_table_name() );
      if( 0 == count( $primary_key_names ) )
      {
        throw lib::create( 'exception\runtime',
          'Unable to create record, single-column primary key "'.
          static::get_primary_key_name().'" does not exist.', __METHOD__ );
      }
      else if( 1 < count( $primary_key_names ) )
      {
        throw lib::create( 'exception\runtime',
          'Unable to create record, multiple primary keys found (there may be tables in the '.
          'application and framework with the same name).', __METHOD__ );
      }
      else if( static::get_primary_key_name() != $primary_key_names[0] )
      {
        throw lib::create( 'exception\runtime',
          'Unable to create record, the table\'s primary key name, "'.
          $primary_key_names[0].'", does not match the class\' primary key name, "'.
          static::get_primary_key_name().'".', __METHOD__ );
      }

      $this->column_values[static::get_primary_key_name()] = intval( $id );
    }

    // now load the data from the database
    // (this gets skipped if a primary key has not been set)
    $this->load();
  }

  /**
   * Loads the record from the database.
   * 
   * If this is a new record then this method does nothing, if the record's primary key is set then
   * the data from the corresponding row is loaded.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\runtime
   * @access public
   */
  public function load()
  {
    $util_class_name = lib::get_class_name( 'util' );
    $database_class_name = lib::get_class_name( 'database\database' );

    if( isset( $this->column_values[static::get_primary_key_name()] ) )
    {
      $primary_key_value = $this->column_values[static::get_primary_key_name()];

      foreach( $this->get_working_table_list() as $table )
      {
        // not using a modifier here is ok since we're forcing id to be an integer
        $sql = sprintf( 'SELECT * FROM %s WHERE %s = %d',
                        $table['name'],
                        $table['key'],
                        $primary_key_value );

        $row = static::db()->get_row( $sql );

        if( 0 == count( $row ) )
        {
          if( static::get_table_name() == $table['name'] )
          {
            throw lib::create( 'exception\runtime',
              sprintf( 'Load failed to find record for %s with %s = %d.',
                       $table['name'],
                       $table['key'],
                       $primary_key_value ),
              __METHOD__ );
          }
          else // extending tables need their foreign key set if row is missing
          {
            $table['columns'][static::get_table_name().'_id'] =
              $this->column_values[static::get_primary_key_name()];
          }
        }
        else
        {
          foreach( $row as $key => $val )
          {
            if( array_key_exists( $key, $table['columns'] ) )
            { // convert data types
              if( !is_null( $val ) )
              {
                $type = static::db()->get_column_data_type( static::get_table_name(), $key );
                if( 'int' == $type ) $val = intval( $val );
                else if( 'float' == $type ) $val = floatval( $val );
                else if( 'tinyint' == $type ) $val = (boolean) $val;
                else if( 'date' == $type || 'time' == $type || 'datetime' == $type )
                  $val = !$val ? NULL : $util_class_name::get_datetime_object( $val );
              }

              $table['columns'][$key] = $val;
            }
          }
        }
      }
    }
  }

  /**
   * Saves the record to the database.
   * 
   * If this is a new record then a new row will be inserted, if not then the row with the
   * corresponding id will be updated.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @throws exception\runtime
   * @access public
   */
  public function save()
  {
    // warn if we are in read-only mode
    if( $this->read_only )
    {
      log::warning( 'Tried to save read-only record.' );
      return;
    }

    $util_class_name = lib::get_class_name( 'util' );
    $database_class_name = lib::get_class_name( 'database\database' );

    $primary_key_value = $this->column_values[static::get_primary_key_name()];

    foreach( $this->get_working_table_list() as $table )
    {
      // building the SET list since it is identical for inserts and updates
      $sets = '';
      $first = true;

      if( $this->write_timestamps && static::get_table_name() == $table['name'] )
      {
        // add the create_timestamp column if this is a new record
        if( is_null( $table['columns'][$table['key']] ) )
        {
          $sets .= 'create_timestamp = NULL';
          $first = false;
        }
      }

      // now add the rest of the columns
      foreach( $table['columns'] as $key => $val )
      {
        if( static::get_table_name() != $table['name'] || $table['key'] != $key )
        {
          $type = static::db()->get_column_data_type( static::get_table_name(), $key );

          // convert from datetime object to mysql-valid datetime string
          if( 'datetime' == $type ) $val = static::db()->format_datetime( $val );
          else if( 'date' == $type ) $val = static::db()->format_date( $val );
          else if( 'time' == $type ) $val = static::db()->format_time( $val );
          else $val = static::db()->format_string( $val );

          $sets .= sprintf( '%s %s = %s', $first ? '' : ',', $key, $val );

          $first = false;
        }
      }

      // either insert or update the row based on whether the primary key is set
      if( static::get_table_name() == $table['name'] )
      {
        $sql = sprintf(
          is_null( $primary_key_value ) ?
          'INSERT INTO %s SET %s' :
          'UPDATE %s SET %s WHERE %s = %d',
          $table['name'],
          $sets,
          $table['key'],
          $primary_key_value );
      }
      else // extending table row may not exist yet
      {
        $sql = sprintf( 'INSERT INTO %s SET %s ON DUPLICATE KEY UPDATE %s',
                        $table['name'],
                        $sets,
                        $sets );
      }

      static::db()->execute( $sql );

      // get the new primary key
      if( $table['name'] == static::get_table_name() &&
          is_null( $table['columns'][$table['key']] ) )
      {
        $primary_key_value = static::db()->insert_id();
        $table['columns'][$table['key']] = $primary_key_value;
      }
    }
  }

  /**
   * Deletes the record.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function delete()
  {
    // warn if we are in read-only mode
    if( $this->read_only )
    {
      log::warning( 'Tried to delete read-only record.' );
      return;
    }

    // check the primary key value
    if( is_null( $this->column_values[static::get_primary_key_name()] ) )
    {
      log::warning( 'Tried to delete record with no id.' );
      return;
    }

    $primary_key_value = $this->column_values[static::get_primary_key_name()];

    // loop through the working tables in reverse order (to avoid reference problems)
    foreach( array_reverse( $this->get_working_table_list() ) as $table )
    {
      // not using a modifier here is ok since we're forcing id to be an integer
      $sql = sprintf( 'DELETE FROM %s WHERE %s = %d',
                      $table['name'],
                      $table['key'],
                      $primary_key_value );
      static::db()->execute( $sql );
    }
  }

  /**
   * Magic get method.
   *
   * Magic get method which returns the column value from the record's table or any extending
   * tables.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $column_name The name of the column or table being fetched from the database
   * @return mixed
   * @throws exception\argument
   * @access public
   */
  public function __get( $column_name )
  {
    // see if the column name starts with an extending table's name
    foreach( self::get_extending_table_list() as $table )
    {
      $len = strlen( $table ) + 1;
      $extending_prefix = substr( $column_name, 0, $len );
      $extending_column = substr( $column_name, $len );
      if( $table.'_' == $extending_prefix &&
          array_key_exists( $extending_column, $this->extending_column_values[$table] ) )
      {
        return isset( $this->extending_column_values[$table][$extending_column] ) ?
          $this->extending_column_values[$table][$extending_column] : NULL;
      }
    }

    // not an column from the extending table list, make sure the column exists in the main table
    if( !static::column_exists( $column_name ) )
      throw lib::create( 'exception\argument', 'column_name', $column_name, __METHOD__ );

    return isset( $this->column_values[$column_name] ) ?
      $this->column_values[$column_name] : NULL;
  }

  /**
   * Magic set method.
   *
   * Magic set method which sets the column value to a record's table or any extending tables.
   * For this change to be writen to the database see the {@link save} method
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $column_name The name of the column
   * @param mixed $value The value to set the contents of a column to
   * @throws exception\argument
   * @access public
   */
  public function __set( $column_name, $value )
  {
    // see if the column name starts with an extending table's name
    foreach( self::get_extending_table_list() as $table )
    {
      $len = strlen( $table ) + 1;
      $extending_prefix = substr( $column_name, 0, $len );
      $extending_column = substr( $column_name, $len );
      if( $table.'_' == $extending_prefix &&
          array_key_exists( $extending_column, $this->extending_column_values[$table] ) )
      {
        $this->extending_column_values[$table][$extending_column] = $value;
        return;
      }
    }

    // not an column from the extending table list, make sure the column exists in the main table
    // make sure the column exists
    if( !static::column_exists( $column_name ) )
      throw lib::create( 'exception\argument', 'column_name', $column_name, __METHOD__ );

    $this->column_values[$column_name] = $value;
  }

  /**
   * Returns all column values in the record as an associative array
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\select $select Defines which columns to return
   * @param database\modifier $modifier Modifications used to access columns
   * @return array
   * @access public
   */
  public function get_column_values( $select = NULL, $modifier = NULL )
  {
    if( !is_null( $select ) && !is_a( $select, lib::get_class_name( 'database\select' ) ) )
      throw lib::create( 'exception\argument', 'select', $select, __METHOD__ );
    if( !is_null( $modifier ) && !is_a( $modifier, lib::get_class_name( 'database\modifier' ) ) )
      throw lib::create( 'exception\argument', 'modifier', $modifier, __METHOD__ );

    $columns = array();
    if( is_null( $select ) )
    {
      $columns = $this->column_values;
    }
    else
    {
      // select this table if one hasn't been selected yet
      if( is_null( $select->get_table_name() ) ) $select->from( static::get_table_name() );
      if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
      $modifier->where( sprintf( '%s.id', $this->get_table_name() ), '=', $this->id );
      $sql = sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() );
      $columns = static::db()->get_row( $sql );

      foreach( $columns as $column => $value )
      {
        if( static::column_exists( $column ) && !is_null( $value ) )
        {
          $type = static::db()->get_column_data_type( static::get_table_name(), $column );
          if( 'int' == $type ) $columns[$column] = intval( $value );
          else if( 'float' == $type ) $columns[$column] = floatval( $value );
          else if( 'tinyint' == $type ) $columns[$column] = (boolean) $value;
        }
      }
    }

    return $columns;
  }

  /**
   * Magic call method.
   * 
   * Magic call method which allows for several methods which get information about records in
   * tables linked to by this table by either a foreign key or joining table.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $name The name of the called function (should be get_<record>,
   *                     get_<record>_count() or get_<record>_list(), where <record> is the name
   *                     of an record class related to this record.
   * @param array $args The arguments passed to the called function.  This can either be null or
   *                    a modifier to be applied to the magic methods.
   * @throws exception\runtime, exception\argument
   * @return mixed
   * @access public
   * @method array get_<record>() Returns the record with foreign keys referencing the <record>
   *               table.  For instance, if a record has a foreign key "other_id", then
   *               get_other() will return the "other" record with the id equal to other_id.
   * @method array get_<record>_list() Returns an array of records (as associative arrays) from the
   *               joining <record> table given the provided modifier.
   * @method array get_<record>_object_list() Returns an array of records (as objects) from the
   *               joining <record> table given the provided modifier.
   * @method int get_<record>_count() Returns the number of records in the joining <record> table
   *             given the provided modifier.
   * @method null add_<record>() Given an array of ids, this method adds associations between the
   *              current and foreign <record> by adding rows into the joining "has" table.
   * @method null remove_<record>() Given an id, this method removes the association between the
                  current and foreign <record> by removing the corresponding row from the joining
                  "has" table.
   */
  public function __call( $name, $args )
  {
    $return_value = NULL;

    // set up regular expressions
    $start = '/^add_|remove_|get_/';
    $end = '/(_list|_object_list|_count)$/';

    // see if the start of the function name is a match
    if( !preg_match( $start, $name, $match ) )
      throw lib::create( 'exception\runtime',
        sprintf( 'Call to undefined function: %s::%s()',
                 get_called_class(),
                 $name ), __METHOD__ );

    $action = substr( $match[0], 0, -1 ); // remove underscore

    // now get the subject by removing the start and end of the function name
    $subject = preg_replace( array( $start, $end ), '', $name );

    // make sure the foreign table exists
    if( !static::db()->table_exists( $subject ) )
      throw lib::create( 'exception\runtime',
        sprintf( 'Call to undefined function: %s::%s() (foreign table does not exist)',
                 get_called_class(),
                 $name ), __METHOD__ );

    if( 'add' == $action )
    { // calling: add_<record>( $ids )
      // make sure the first argument is an integer or non-empty array of ids
      if( 1 != count( $args ) ||
          is_object( $args[0] ) ||
          ( is_array( $args[0] ) && 0 < count( $args[0] ) ) )
        throw lib::create( 'exception\argument', 'args', $args, __METHOD__ );

      $ids = $args[0];
      $this->add_records( $subject, $ids );
      return;
    }
    else if( 'remove' == $action )
    { // calling: remove_<record>( $ids )
      // make sure the first argument is an integer or non-empty array of ids
      if( 1 != count( $args ) ||
          is_object( $args[0] ) ||
          ( is_array( $args[0] ) && 0 < count( $args[0] ) ) )
        throw lib::create( 'exception\argument', 'args', $args, __METHOD__ );

      $id = $args[0];
      $this->remove_record( $subject, $id );
      return;
    }
    else if( 'get' == $action )
    {
      // get the end of the function name
      $sub_action = preg_match( $end, $name, $match ) ? substr( $match[0], 1 ) : false;

      if( !$sub_action )
      {
        // calling: get_<record>()
        // make sure this table has the correct foreign key
        if( !static::column_exists( $subject.'_id' ) )
          throw lib::create( 'exception\runtime',
            sprintf( 'Call to undefined function: %s::%s() (foreign key not found)',
                     get_called_class(),
                     $name ), __METHOD__ );
        return $this->get_record( $subject );
      }
      else
      {
        if( 'list' == $sub_action )
        { // calling: get_<record>_list( $select = NULL, $modifier = NULL )
          return $this->get_record_list(
            $subject,
            0 < count( $args ) && !is_null( $args[0] ) ? $args[0] : NULL,
            1 < count( $args ) && !is_null( $args[1] ) ? $args[1] : NULL );
        }
        else if( 'object_list' == $sub_action )
        { // calling: get_<record>_object_list( $modifier = NULL )
          return $this->get_record_object_list(
            $subject,
            0 < count( $args ) && !is_null( $args[0] ) ? $args[0] : NULL );
        }
        else if( 'count' == $sub_action )
        { // calling: get_<record>_count( $modifier = NULL )
          return $this->get_record_count(
            $subject,
            0 < count( $args ) && !is_null( $args[0] ) ? $args[0] : NULL );
        }
        else
        {
          throw lib::create( 'exception\runtime',
            sprintf( 'Call to undefined function: %s::%s() (invalid sub-action)',
                     get_called_class(),
                     $name ), __METHOD__ );
        }
      }
    }

    // if we get here then something went wrong
    throw lib::create( 'exception\runtime',
      sprintf( 'Call to undefined function: %s::%s() (failed to recoginize method)',
               get_called_class(),
               $name ), __METHOD__ );
  }

  /**
   * Returns the record with foreign keys referencing the record table.
   * This method is used to select a record's parent record in many-to-one relationships.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $record_type The type of record.
   * @return record
   * @access protected
   */
  protected function get_record( $record_type )
  {
    // check the primary key value
    if( is_null( $this->column_values[static::get_primary_key_name()] ) )
    {
      log::warning( 'Tried to query record with no id.' );
      return NULL;
    }

    $foreign_key_name = $record_type.'_id';

    // make sure this table has the correct foreign key
    if( !static::column_exists( $foreign_key_name ) )
    {
      log::warning( 'Tried to get invalid record type: '.$record_type );
      return NULL;
    }

    // create the record using the foreign key
    $record = NULL;
    if( !is_null( $this->column_values[$foreign_key_name] ) )
      $record = lib::create( 'database\\'.$record_type, $this->column_values[$foreign_key_name] );

    return $record;
  }

  /**
   * Returns an array of records (as arrays or objects) from the joining record table.
   * This method is used to select a record's child records in one-to-many or many-to-many
   * relationships.
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $record_type The type of record.
   * @param database\select $select Which columns to select
   * @param database\modifier $modifier A modifier to apply to the list
   * @param boolean $return_alternate One of "object" or "count" to return objects or a count total
   * @return array( associative or array ) | int
   * @access protected
   */
  protected function get_record_list( $record_type, $select = NULL, $modifier = NULL, $return_alternate = '' )
  {
    if( !is_string( $record_type ) || 0 == strlen( $record_type ) )
      throw lib::create( 'exception\argument', 'record_type', $record_type, __METHOD__ );
    if( !is_null( $select ) && !is_a( $select, lib::get_class_name( 'database\select' ) ) )
      throw lib::create( 'exception\argument', 'select', $select, __METHOD__ );
    if( !is_null( $modifier ) && !is_a( $modifier, lib::get_class_name( 'database\modifier' ) ) )
      throw lib::create( 'exception\argument', 'modifier', $modifier, __METHOD__ );
    if( !is_string( $return_alternate ) )
      throw lib::create( 'exception\argument', 'return_alternate', $return_alternate, __METHOD__ );

    if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );

    $table_name = static::get_table_name();
    $primary_key_name = sprintf( '%s.%s', $table_name, static::get_primary_key_name() );
    $foreign_class_name = lib::get_class_name( 'database\\'.$record_type );

    // check the primary key value
    $primary_key_value = $this->column_values[static::get_primary_key_name()];
    if( is_null( $primary_key_value ) )
    {
      log::warning( 'Tried to query record with no id.' );
      return array();
    }

    $return_value = 'count' == $return_alternate ? 0 : array();

    // this method varies depending on the relationship type
    $relationship_class_name = lib::get_class_name( 'database\relationship' );
    $relationship = static::get_relationship( $record_type );
    if( $relationship_class_name::NONE == $relationship )
    {
      log::err(
        sprintf( 'Tried to get a %s list from a %s, but there is no relationship between the two.',
                 $record_type,
                 $table_name ) );
    }
    else if( $relationship_class_name::ONE_TO_ONE == $relationship )
    {
      log::err(
        sprintf( 'Tried to get a %s list from a %s, but there is a '.
                 'one-to-one relationship between the two.',
                 $record_type,
                 $table_name ) );
    }
    else if( $relationship_class_name::ONE_TO_MANY == $relationship ||
             $relationship_class_name::MANY_TO_MANY == $relationship )
    {
      if( $relationship_class_name::ONE_TO_MANY == $relationship )
      {
        $column_name = sprintf( '%s.%s_id', $record_type, $table_name );
        if( !$modifier->has_join( $table_name ) )
          $modifier->join( $table_name, $column_name, $primary_key_name );
        $modifier->where( $column_name, '=', $primary_key_value );
      }
      else // MANY_TO_MANY
      {
        $joining_table_name = static::get_joining_table_name( $record_type );
        $foreign_key_name = sprintf( '%s.%s', $record_type, $foreign_class_name::get_primary_key_name() );
        $joining_primary_key_name = sprintf( '%s.%s_id', $joining_table_name, $table_name );
        $joining_foreign_key_name = sprintf( '%s.%s_id', $joining_table_name, $record_type );

        if( !$modifier->has_join( $table_name ) )
        {
          $modifier->cross_join( $joining_table_name, $foreign_key_name, $joining_foreign_key_name );
          $modifier->cross_join( $table_name, $joining_primary_key_name, $primary_key_name );
        }
        $modifier->where( $primary_key_name, '=', $primary_key_value );
      }

      if( 'count' == $return_alternate )
      {
        $return_value = $foreign_class_name::count( $modifier );
      }
      else
      {
        $return_value = 'object' == $return_alternate
                      ? $foreign_class_name::select_objects( $modifier )
                      : $foreign_class_name::select( $select, $modifier );
      }

    }
    else
    {
      // if we get here then the relationship type is unknown
      log::crit( sprintf( 'Record %s has an unknown relationship to %s.', $table_name, $record_type ) );
    }

    return $return_value;
  }

  /**
   * 
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $record_type The type of record.
   * @param database\modifier $modifier A modifier to apply to the list
   * @return array( record )
   * @access protected
   */
  public function get_record_object_list( $record_type, $modifier = NULL )
  {
    return $this->get_record_list( $record_type, NULL, $modifier, 'object' );
  }

  /**
   * 
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $record_type The type of record.
   * @param database\modifier $modifier A modifier to apply to the list or count.
   * @return associative array
   * @access protected
   */
  public function get_record_count( $record_type, $modifier = NULL )
  {
    return $this->get_record_list( $record_type, NULL, $modifier, 'count' );
  }

  /**
   * Given an array of ids, this method adds associations between the current and foreign record
   * by adding rows into the joining "has" table.
   * This method is used to add child records for many-to-many relationships.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $record_type The type of record.
   * @param int|array(int) $ids A single or array of primary key values for the record(s) being
   *                       added.
   * @access protected
   */
  protected function add_records( $record_type, $ids )
  {
    // warn if we are in read-only mode
    if( $this->read_only )
    {
      log::warning(
        'Tried to add '.$record_type.' records to read-only record.' );
      return;
    }

    $util_class_name = lib::get_class_name( 'util' );

    // check the primary key value
    $primary_key_value = $this->column_values[static::get_primary_key_name()];
    if( is_null( $primary_key_value ) )
    {
      log::warning( 'Tried to query record with no id.' );
      return;
    }

    // this method only supports many-to-many relationships.
    $relationship_class_name = lib::get_class_name( 'database\relationship' );
    $relationship = static::get_relationship( $record_type );
    if( $relationship_class_name::MANY_TO_MANY != $relationship )
    {
      log::err(
        sprintf( 'Tried to add %s to a %s without a many-to-many relationship between the two.',
                 $util_class_name::prulalize( $record_type ),
                 static::get_table_name() ) );
      return;
    }

    $database_class_name = lib::get_class_name( 'database\database' );
    $joining_table_name = static::get_joining_table_name( $record_type );

    // if ids is not an array then create a single-element array with it
    if( !is_array( $ids ) ) $ids = array( $ids );

    $values = '';
    $first = true;
    foreach( $ids as $foreign_key_value )
    {
      if( !$first ) $values .= ', ';
      $values .= sprintf( $this->write_timestamps
                          ? '(NULL, %s, %s)'
                          : '(%s, %s)',
                          static::db()->format_string( $primary_key_value ),
                          static::db()->format_string( $foreign_key_value ) );
      $first = false;
    }

    static::db()->execute(
      sprintf( $this->write_timestamps
               ? 'INSERT INTO %s (create_timestamp, %s_id, %s_id) VALUES %s'
               : 'INSERT INTO %s (%s_id, %s_id) VALUES %s',
               $joining_table_name,
               static::get_table_name(),
               $record_type,
               $values ) );
  }

  /**
   * Given an id, this method removes the association between the current and record by removing
   * the corresponding row from the joining "has" table.
   * This method is used to remove child records from one-to-many or many-to-many relationships.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $record_type The type of record.
   * @param int $id The primary key value for the record being removed.
   * @access protected
   */
  protected function remove_record( $record_type, $id )
  {
    // warn if we are in read-only mode
    if( $this->read_only )
    {
      log::warning(
        'Tried to remove '.$foreign_table_name.' records to read-only record.' );
      return;
    }

    // check the primary key value
    $primary_key_value = $this->column_values[static::get_primary_key_name()];
    if( is_null( $primary_key_value ) )
    {
      log::warning( 'Tried to query record with no id.' );
      return;
    }

    // this method varies depending on the relationship type
    $relationship_class_name = lib::get_class_name( 'database\relationship' );
    $relationship = static::get_relationship( $record_type );
    if( $relationship_class_name::NONE == $relationship )
    {
      log::err(
        sprintf( 'Tried to remove a %s from a %s, but there is no relationship between the two.',
                 $record_type,
                 static::get_table_name() ) );
    }
    else if( $relationship_class_name::ONE_TO_ONE == $relationship )
    {
      log::err(
        sprintf( 'Tried to remove a %s from a %s, but there is a '.
                 'one-to-one relationship between the two.',
                 $record_type,
                 static::get_table_name() ) );
    }
    else if( $relationship_class_name::ONE_TO_MANY == $relationship )
    {
      $record = lib::create( 'database\\'.$record_type, $id );
      $record->delete();
    }
    else if( $relationship_class_name::MANY_TO_MANY == $relationship )
    {
      $joining_table_name = static::get_joining_table_name( $record_type );

      $modifier = lib::create( 'database\modifier' );
      $column_name = sprintf( '%s.%s_id', $joining_table_name, static::get_table_name() );
      $modifier->where( $column_name, '=', $primary_key_value );
      $column_name = sprintf( '%s.%s_id', $joining_table_name, $record_type );
      $modifier->where( $column_name, '=', $id );

      static::db()->execute(
        sprintf( 'DELETE FROM %s %s',
                 $joining_table_name,
                 $modifier->get_sql() ) );
    }
    else
    {
      // if we get here then the relationship type is unknown
      log::crit(
        sprintf( 'Record %s has an unknown relationship to %s.',
                 static::get_table_name(),
                 $record_type ) );
    }
  }

  /**
   * Gets the name of the joining table between this record and another.
   * If no such table exists then an empty string is returned.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $record_type The type of record.
   * @static
   * @access public
   */
  public static function get_joining_table_name( $record_type )
  {
    // the joining table may be <table>_has_<foreign_table> or <foreign>_has_<table>
    $table_name = static::get_table_name();
    $forward_joining_table_name = $table_name.'_has_'.$record_type;
    $reverse_joining_table_name = $record_type.'_has_'.$table_name;

    $joining_table_name = "";
    if( static::db()->table_exists( $forward_joining_table_name ) )
    {
      $joining_table_name = $forward_joining_table_name;
    }
    else if( static::db()->table_exists( $reverse_joining_table_name ) )
    {
      $joining_table_name = $reverse_joining_table_name;
    }

    return $joining_table_name;
  }

  /**
   * Gets the type of relationship this record has to another record.
   * See the relationship class for return values.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $record_type The type of record.
   * @return int (relationship::const)
   * @static
   * @access public
   */
  public static function get_relationship( $record_type )
  {
    $relationship_class_name = lib::get_class_name( 'database\relationship' );
    $type = $relationship_class_name::NONE;
    $table_class_name = lib::get_class_name( 'database\\'.$record_type );
    if( $table_class_name::column_exists( static::get_table_name().'_id' ) )
    { // the record_type has a foreign key for this record
      $type = static::column_exists( $record_type.'_id' )
            ? $relationship_class_name::ONE_TO_ONE
            : $relationship_class_name::ONE_TO_MANY;
    }
    else if( 0 < strlen( static::get_joining_table_name( $record_type ) ) )
    { // a joining table was found
      $type = $relationship_class_name::MANY_TO_MANY;
    }

    return $type;
  }

  /**
   * Selects a number of records as array data
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\select $select Defines which columns to select
   * @param database\modifier $modifier Modifications to the selection
   * @return associative array
   * @static
   * @access public
   */
  public static function select( $select = NULL, $modifier = NULL, $return_alternate = '' )
  {
    if( !is_null( $select ) && !is_a( $select, lib::get_class_name( 'database\select' ) ) )
      throw lib::create( 'exception\argument', 'select', $select, __METHOD__ );
    if( !is_null( $modifier ) && !is_a( $modifier, lib::get_class_name( 'database\modifier' ) ) )
      throw lib::create( 'exception\argument', 'modifier', $modifier, __METHOD__ );

    $return_value = 'count' == $return_alternate ? 0 : array();

    // create the select statement one isn't provided
    if( is_null( $select ) )
    {
      $select = lib::create( 'database\select' );
      if( 'count' == $return_alternate )
      {
        $select->add_column( 'COUNT(*)', 'total', false );
      }
      else if( 'object' == $return_alternate )
      {
        $select->add_column( static::get_primary_key_name() );
      }
      else
      {
        $select->add_all_table_columns();
      }
    }

    // select this table if one hasn't been selected yet
    if( is_null( $select->get_table_name() ) ) $select->from( static::get_table_name() );

    if( 'count' == $return_alternate )
    {
      $sql = sprintf( '%s %s',
                      $select->get_sql(),
                      is_null( $modifier ) ? '' : $modifier->get_sql( true ) );

      // if the modifier has a group statement then we want the number of returned rows
      $return_value = 0 < count( $modifier->get_group_columns() )
                    ? count( static::db()->get_all( $sql ) )
                    : intval( static::db()->get_one( $sql ) );
    }
    else
    {
      $sql = sprintf( '%s %s',
                      $select->get_sql(),
                      is_null( $modifier ) ? '' : $modifier->get_sql() );
      $return_value = static::db()->get_all( $sql );
      if( 'object' == $return_alternate )
      { // convert ids to records
        $records = array();
        foreach( $return_value as $row ) $records[] = new static( $row['id'] );
        $return_value = $records;
      }
      else
      { // convert data types
        foreach( $return_value as $index => $row )
        {
          foreach( $row as $column => $value )
          {
            if( static::column_exists( $column ) && !is_null( $value ) )
            {
              $type = static::db()->get_column_data_type( static::get_table_name(), $column );
              if( 'int' == $type ) $return_value[$index][$column] = intval( $value );
              else if( 'float' == $type ) $return_value[$index][$column] = floatval( $value );
              else if( 'tinyint' == $type ) $return_value[$index][$column] = (boolean) $value;
            }
          }
        }
      }
    }

    return $return_value;
  }

  /**
   * Selects a number of records and returns them as an array of active record objects
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the selection.
   * @return array( record )
   * @static
   * @access public
   */
  public static function select_objects( $modifier = NULL )
  {
    return static::select( NULL, $modifier, 'object' );
  }

  /**
   * Count the total number of rows in the table
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the selection.
   * @return int
   * @static
   * @access public
   */
  public static function count( $modifier = NULL )
  {
    return static::select( NULL, $modifier, 'count' );
  }

  /**
   * Get record using the columns from a unique key.
   * 
   * This method returns an instance of the record using the name(s) and value(s) of a unique key.
   * If the unique key has multiple columns then the $column and $value arguments should be arrays.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string|array $column A column with the unique key property (or array of columns)
   * @param string|array $value The value of the column to match (or array of values)
   * @return database\record
   * @static
   * @access public
   */
  public static function get_unique_record( $column, $value )
  {
    $record = NULL;

    // if the column is ID then there's no need to search for unique keys
    if( 'id' == $column || ( is_array( $column ) && 1 == count( $column ) && 'id' == $column[0] ) )
      return new static( is_array( $value ) ? current( $value ) : $value );

    // create an associative array from the column/value arguments and sort
    if( is_array( $column ) && is_array( $value ) )
      foreach( $column as $index => $col ) $columns[$col] = $value[$index];
    else $columns[$column] = $value;
    ksort( $columns );

    // make sure the column(s) complete a unique key
    $found = false;
    foreach( static::db()->get_unique_keys( static::get_table_name() ) as $unique_key )
    {
      if( count( $columns ) == count( $unique_key ) )
      {
        sort( $unique_key );
        reset( $unique_key );
        foreach( $columns as $col => $val )
        {
          $found = $col == current( $unique_key );
          if( !$found ) break;
          next( $unique_key );
        }
      }

      if( $found ) break;
    }

    // make sure the column is unique
    if( !$found )
    {
      log::err( 'Trying to get unique record from table "'.
                static::get_table_name().'" using invalid columns.' );
    }
    else
    {
      $select = lib::create( 'database\select' );
      $select->from( static::get_table_name() );
      $select->add_column( static::get_primary_key_name() );
      $modifier = lib::create( 'database\modifier' );
      foreach( $columns as $col => $val ) $modifier->where( $col, '=', $val );

      // this returns null if no records are found
      $id = static::db()->get_one( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );
      if( !is_null( $id ) ) $record = new static( $id );
    }

    return $record;
  }

  /**
   * Returns the name of the table associated with this record.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @static
   * @access public
   */
  public static function get_table_name()
  {
    // Table and class names (without namespaces) should always be identical
    return substr( strrchr( get_called_class(), '\\' ), 1 );
  }

  /**
   * Returns an array of column names for this table.  Any columns in the database by the name
   * 'update_timestamp' or 'create_timestamp' are always ignored and left out of the active record.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return array( string )
   * @access public
   */
  public function get_column_names()
  {
    return static::db()->get_column_names( static::get_table_name() );
  }

  /**
   * Returns the name of this record's primary key.
   * The schema does not currently support multiple-column primary keys, so this method always
   * returns a single column name.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return string
   * @static
   * @access public
   */
  public static function get_primary_key_name()
  {
    return static::$primary_key_name;
  }

  /**
   * Returns an array of all enum values for a particular column.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $column_name A column name in the record's corresponding table.
   * @return array( string )
   * @static
   * @access public
   */
  public static function get_enum_values( $column_name )
  {
    // match all strings in single quotes, then cut out the quotes from the match and return them
    $type = static::db()->get_column_type( static::get_table_name(), $column_name );
    preg_match_all( "/'[^']+'/", $type, $matches );
    $values = array();
    foreach( current( $matches ) as $match ) $values[] = substr( $match, 1, -1 );

    return $values;
  }

  /**
   * Returns an array of all distinct values for a particular column.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $column_name A column name in the record's corresponding table.
   * @return array( string )
   * @static
   * @access public
   */
  public static function get_distinct_values( $column_name )
  {
    // not an column from the extending table list, make sure the column exists in the main table
    if( !static::column_exists( $column_name ) )
      throw lib::create( 'exception\argument', 'column_name', $column_name, __METHOD__ );

    $sql = sprintf( 'SELECT DISTINCT %s FROM %s ORDER BY %s',
                    $column_name,
                    static::get_table_name(),
                    $column_name );
    return static::db()->get_col( $sql );
  }

  /**
   * Convenience method for database::column_exists(), but for this record
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $column_name A column name.
   * @param boolean $include_extending_tables Whether to include the column search in the
   *                extending tables
   * @return string
   * @static
   * @access public
   */
  public static function column_exists( $column_name, $include_extending_tables = false )
  {
    $found = static::db()->column_exists( static::get_table_name(), $column_name );

    if( $include_extending_tables && !$found )
    {
      foreach( self::get_extending_table_list() as $extending_table )
      {
        $table_name = sprintf( '%s_%s', static::get_table_name(), $extending_table );
        $len = strlen( $extending_table ) + 1;
        $extending_column = substr( $column_name, $len );
        if( static::db()->column_exists( $table_name, $extending_column ) )
        {
          $found = true;
          break;
        }
      }
    }

    return $found;
  }

  /**
   * Returns the record's database.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return database
   * @static
   * @access public
   */
  public static function db()
  {
    if( is_null( static::$db ) ) static::$db = lib::create( 'business\session' )->get_database();
    return static::$db;
  }

  /**
   * A list of tables which extend this record's data.  This is to be used by extending classes
   * of a record defined in the framework.  For instance, to add address details to the user
   * record a new table, user_address, is created with a column "user_id" as a primary key which
   * is also a foreign key to the user table.  Then, this method is called at the end of the user
   * class declaration with the argument "address".  The record will then act as if the columns in
   * user_address (not including the user_id column) are in the user table.
   * NOTE: do not include update_timestamp or create_timestamp columns in the extending table.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @static
   * @access public
   */
  public static function add_extending_table( $table )
  {
    $class_index = lib::get_class_name( get_called_class(), true );
    if( !array_key_exists( $class_index, self::$extending_table_list ) )
      self::$extending_table_list[$class_index] = array();

    self::$extending_table_list[$class_index][] = $table;
  }

  /**
   * Returns an array of all extending tables, or an empty array if there are no extending tables.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return array
   * @static
   * @access protecteda
   */
  protected static function get_extending_table_list()
  {
    $class_index = lib::get_class_name( get_called_class(), true );
    return array_key_exists( $class_index, self::$extending_table_list ) ?
      self::$extending_table_list[$class_index] : array();
  }

  /**
   * Returns an array of table name, key and reference to column values for all tables associated
   * with this record.  This includes the main table first, then all extending tables in the order
   * they were added to the record using the add_extending_tables() method.
   * This method is used internally by this class only.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return array
   * @access private
   */
  private function get_working_table_list()
  {
    // make an array containing this record's table name, key and a reference to its column values
    // then add the same for any extending tables
    $tables = array();
    $tables[] = array( 'name' => static::get_table_name(),
                       'key' => static::get_primary_key_name(),
                       'columns' => & $this->column_values );

    foreach( self::get_extending_table_list() as $extending_table )
    {
      // make sure the extending column values array exists
      if( !array_key_exists( $extending_table, $this->extending_column_values ) )
        $this->extending_column_values[$extending_table] = array();

      $table_name = sprintf( '%s_%s', static::get_table_name(), $extending_table );
      $tables[] = array(
        'name' => $table_name,
        'key' => sprintf( '%s_%s', static::get_table_name(), static::get_primary_key_name() ),
        'columns' => & $this->extending_column_values[$extending_table] );
    }

    return $tables;
  }

  /**
   * An instance to the database object the record belongs to
   * @var database\database
   * @access protected
   * @static
   */
  protected static $db = null;

  /**
   * Determines whether the record is read only (no modifying the database).
   * @var boolean
   * @access protected
   */
  protected $read_only = false;

  /**
   * Holds all table column values in an associative array where key=>value is
   * column_name=>column_value
   * @var array
   * @access private
   */
  private $column_values = array();

  /**
   * Determines whether or not to include create_timestamp and update_timestamp when writing
   * records to the database.
   * @var boolean
   * @static
   * @access protected
   */
  protected $write_timestamps = true;

  /**
   * The name of the table's primary key column.
   * @var string
   * @static
   * @access protected
   */
  protected static $primary_key_name = 'id';

  /**
   * Defines which unique key to use when asking to convert primary and unique keys.
   * @var array( string )
   * @static
   * @access private
   */
  private static $primary_unique_key_list = array();

  /**
   * A list of tables which extend this record's data.  See add_extending_table() for more details.
   * @var array
   * @static
   * @access private
   */
  private static $extending_table_list = array();

  /**
   * Holds all extending column values in an associative array where key=>key=>value is
   * extending_table=>column=>column_value
   * @var array
   * @access private
   */
  private $extending_column_values = array();
}
