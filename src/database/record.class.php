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
 * extends this class.  Furthermore, each table must have a single column as its primary key.
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

    // set the default value for all columns
    $table_name = static::get_table_name();
    foreach( static::db()->get_column_names( $table_name ) as $column )
    {
      // If the default is CURRENT_TIMESTAMP, or if there is a DATETIME column by the name
      // 'start_datetime' then make the default the current date and time.
      // Because mysql does not allow setting the default value for a DATETIME column to be
      // NOW() we need to set the default here manually
      $default = static::db()->get_column_default( $table_name, $column );
      $this->passive_column_values[$column] = NULL;

      if( 'start_datetime' == $column || 'CURRENT_TIMESTAMP' == $default )
        $this->active_column_values[$column] = $util_class_name::get_datetime_object();
      else if( !is_null( $default ) )
      {
        $type = static::db()->get_column_variable_type( $table_name, $column );
        if( 'datetime' == $type || 'timestamp' == $type )
        {
          $default = !$default ? NULL : $util_class_name::get_datetime_object( $default );
          // convert timestamps from server to UTC time
          if( 'timestamp' == $type && !is_null( $default ) ) $default->setTimezone( new \DateTimeZone( 'UTC' ) );
        }
        else if( 'string' != $type ) settype( $default, $type );
        $this->active_column_values[$column] = $default;
      }
    }

    if( NULL != $id )
    {
      // make sure this table has an id column as the primary key
      $primary_key_names = static::db()->get_primary_key( $table_name );
      if( 0 == count( $primary_key_names ) )
      {
        throw lib::create( 'exception\runtime',
          'Unable to create record, single-column primary key "'.
          static::$primary_key_name.'" does not exist.', __METHOD__ );
      }
      else if( 1 < count( $primary_key_names ) )
      {
        throw lib::create( 'exception\runtime',
          'Unable to create record, multiple primary keys found (there may be tables in the '.
          'application and framework with the same name).', __METHOD__ );
      }
      else if( static::$primary_key_name != $primary_key_names[0] )
      {
        throw lib::create( 'exception\runtime',
          'Unable to create record, the table\'s primary key name, "'.
          $primary_key_names[0].'", does not match the class\' primary key name, "'.
          static::$primary_key_name.'".', __METHOD__ );
      }

      $this->passive_column_values[static::$primary_key_name] = intval( $id );
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

    if( isset( $this->passive_column_values[static::$primary_key_name] ) )
    {
      $table_name = static::get_table_name();
      $primary_key_value = $this->passive_column_values[static::$primary_key_name];

      // not using a modifier here is ok since we're forcing id to be an integer
      $sql = sprintf( 'SELECT * FROM %s WHERE %s = %d',
                      $table_name,
                      static::$primary_key_name,
                      $primary_key_value );

      $row = static::db()->get_row( $sql );

      if( 0 == count( $row ) )
      {
        throw lib::create( 'exception\runtime',
          sprintf( 'Load failed to find record for %s with %s = %d.',
                   $table_name,
                   static::$primary_key_name,
                   $primary_key_value ),
          __METHOD__ );
      }
      else
      {
        foreach( $row as $column => $value )
        {
          if( array_key_exists( $column, $this->passive_column_values ) )
          { // convert data types
            if( !is_null( $value ) )
            {
              $type = static::db()->get_column_variable_type( $table_name, $column );
              if( 'datetime' == $type || 'timestamp' == $type )
              {
                $value = !$value ? NULL : $util_class_name::get_datetime_object( $value );
                // convert timestamps from server to UTC time
                if( 'timestamp' == $type && !is_null( $value ) )
                  $value->setTimezone( new \DateTimeZone( 'UTC' ) );
              }
              else if( 'string' != $type ) settype( $value, $type );
            }

            $this->passive_column_values[$column] = $value;
          }
        }
      }
    }

    // clean out active values
    $this->active_column_values = array();
  }

  /**
   * TODO: document
   */
  private function get_set_list( $new )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $table_name = static::get_table_name();

    // building the SET list since it is identical for inserts and updates
    $set_list = [];

    // add the create_timestamp column if this is a new record
    if( $this->write_timestamps && $new ) $set_list['create_timestamp'] = static::db()->format_string( NULL );

    // now add the rest of the columns
    foreach( $this->active_column_values as $column => $value )
    {
      if( static::$primary_key_name != $column )
      {
        $type = static::db()->get_column_data_type( $table_name, $column );

        // convert from datetime object to mysql-valid datetime string
        if( 'datetime' == $type || 'timestamp' == $type )
        {
          $value = !$value ? NULL : $util_class_name::get_datetime_object( $value );
          // convert timestamps to server time
          if( 'timestamp' == $type && !is_null( $value ) )
            $value->setTimezone( new \DateTimeZone( date_default_timezone_get() ) );
          $value = static::db()->format_datetime( $value );
        }
        else if( 'date' == $type ) $value = static::db()->format_date( $value );
        else if( 'time' == $type ) $value = static::db()->format_time( $value );
        else $value = static::db()->format_string( $value );

        $set_list[$column] = $value;
      }
    }

    return $set_list;
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

    // do not save anything if there are no active values
    if( 0 == count( $this->active_column_values ) ) return;

    $table_name = static::get_table_name();
    $primary_key_value = $this->passive_column_values[static::$primary_key_name];

    // build the "sets" sql
    $set_list = $this->get_set_list( is_null( $primary_key_value ) );
    array_walk( $set_list, function( &$value, $column ) { $value = sprintf( '  %s = %s', $column, $value ); } );
    $sets = implode( ",\n", $set_list );

    if( 0 < strlen( $sets ) )
    {
      // either insert or update the row based on whether the primary key is set
      $sql = sprintf(
        is_null( $primary_key_value ) ?
        'INSERT INTO %s SET'."\n".'%s' :
        'UPDATE %s SET'."\n".'%s'."\n".'WHERE %s = %d',
        $table_name,
        $sets,
        static::$primary_key_name,
        $primary_key_value );

      static::db()->execute( $sql );

      // get the new primary key
      if( is_null( $primary_key_value ) )
        $this->passive_column_values[static::$primary_key_name] = static::db()->insert_id();

      // transfer active to passive values
      foreach( $this->active_column_values as $column => $value )
        $this->passive_column_values[$column] = $value;
      $this->active_column_values = array();
    }
  }

  /**
   * TODO: document
   */
  public function save_list( $select, $modifier )
  {
    $table_name = static::get_table_name();

    // add the select's aliases to the list of columns to insert
    $columns = $select->get_alias_list();

    // now add the record's columns to the list of columns to insert, removing any from the previous step
    $set_list = $this->get_set_list( true );
    foreach( array_intersect( array_keys( $set_list ), $columns ) as $column ) unset( $set_list[$column] );
    $columns = array_merge( $columns, array_keys( $set_list ) );

    // add the table prefix to each column
    foreach( $columns as $index => $column ) $columns[$index] = sprintf( '%s.%s', $table_name, $column );

    // and add the values from the set list to the select object as constants
    foreach( $set_list as $column => $value ) $select->add_constant( $value, $column, NULL, false );

    $sql = sprintf( 'INSERT INTO %s ('."\n".'  %s'."\n".')'."\n".'%s %s',
                    $table_name,
                    implode( ",\n  ", $columns ),
                    $select->get_sql(),
                    $modifier->get_sql() );

    static::db()->execute( $sql );
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
    if( is_null( $this->passive_column_values[static::$primary_key_name] ) )
    {
      log::warning( 'Tried to delete record with no primary key.' );
      return;
    }

    // not using a modifier here is ok since we're forcing id to be an integer
    $sql = sprintf( 'DELETE FROM %s WHERE %s = %d',
                    static::get_table_name(),
                    static::$primary_key_name,
                    $this->passive_column_values[static::$primary_key_name] );
    static::db()->execute( $sql );

    $this->passive_column_values[static::$primary_key_name] = NULL;
  }

  /**
   * Magic get method.
   *
   * Magic get method which returns the column value from the record's table.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $column_name The name of the column or table being fetched from the database
   * @return mixed
   * @throws exception\argument
   * @access public
   */
  public function __get( $column_name )
  {
    // make sure the column exists
    if( !static::column_exists( $column_name ) )
      throw lib::create( 'exception\argument', 'column_name', $column_name, __METHOD__ );

    return array_key_exists( $column_name, $this->active_column_values ) ?
           $this->active_column_values[$column_name] :
           $this->passive_column_values[$column_name];
  }

  /**
   * Magic set method.
   *
   * Magic set method which sets the column value to a record's table.
   * For this change to be writen to the database see the {@link save} method
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $column_name The name of the column
   * @param mixed $value The value to set the contents of a column to
   * @throws exception\argument
   * @access public
   */
  public function __set( $column_name, $value )
  {
    $util_class_name = lib::get_class_name( 'util' );

    // make sure the column exists and isn't the primary key
    if( !static::column_exists( $column_name ) )
      throw lib::create( 'exception\argument', 'column_name', $column_name, __METHOD__ );
    if( static::get_primary_key_name() == $column_name )
      throw lib::create( 'exception\runtime',
        'Tried to write to record\'s primary key which is forbidden',
        __METHOD__ );

    // do not allow writing of create_timestamp or update_timestamp columns
    if( 'create_timestamp' == $column_name || 'update_timestamp' == $column_name )
      throw lib::create( 'exception\runtime', sprintf( 'Cannot edit %s column', $column_name ), __METHOD__ );

    if( !is_null( $value ) )
    {
      // if the column is an enum, make sure the new value is valid
      $enum_values = $this->get_enum_values( $column_name );
      if( !is_null( $enum_values ) && !in_array( $value, $enum_values ) )
        throw lib::create( 'exception\argument', 'value', $value, __METHOD__ );

      // if the column is a datetime or timestamp
      $type = static::db()->get_column_data_type( static::get_table_name(), $column_name );
      if( 'datetime' == $type || 'timestamp' == $type )
      {
        // convert to a datetime object
        $value = $util_class_name::get_datetime_object( $value );

        // convert timestamps from server to UTC time
        if( 'timestamp' == $type ) $value->setTimezone( new \DateTimeZone( 'UTC' ) );
      }
    }

    if( $this->passive_column_values[$column_name] === $value )
    {
      // we're setting the value to the passive value, so remove the column from the active array
      if( array_key_exists( $column_name, $this->active_column_values ) )
        unset( $this->active_column_values[$column_name] );
    }
    else
    {
      // the value is different from what's in the passive array, so store it in the active array
      $this->active_column_values[$column_name] = $value;
    }
  }

  /**
   * Returns whether a column has been modified from the value in the database
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string/array $search The name of the column (or an array of column names)
   * @return boolean
   * @access public
   */
  public function has_column_changed( $search )
  {
    return is_array( $search ) ?
      0 < count( array_intersect( $search, array_keys( $this->active_column_values ) ) ) :
      array_key_exists( $search, $this->active_column_values );
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

    $table_name = static::get_table_name();
    $columns = array();

    if( is_null( $select ) )
    {
      $columns = $this->passive_column_values;
    }
    else
    {
      // select this table if one hasn't been selected yet
      if( is_null( $select->get_table_name() ) ) $select->from( $table_name );

      if( $select->has_external_table_columns() ||
          ( !is_null( $modifier ) && 0 < $modifier->get_join_count() ) )
      { // the select/modifier statements are requiring that we query the database
        if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
        $modifier->where( sprintf( '%s.id', $table_name ), '=', $this->id );
        $sql = sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() );
        $columns = static::db()->get_row( $sql );

        // convert non-null values
        if( is_array( $columns ) )
        {
          foreach( $columns as $column => $value )
          {
            if( !is_null( $value ) )
            {
              // see if the column is an alias in the select object
              $type = NULL;
              $alias_details = NULL;
              $current_column_name = $column;
              $current_table_name = NULL;
              if( $select->has_alias( $column ) )
              {
                $alias_details = $select->get_alias_details( $column );
                $type = $alias_details['type'];
                if( is_null( $type ) )
                {
                  $current_column_name = $alias_details['column'];
                  $current_table_name = 0 == strlen( $alias_details['table'] )
                                      ? $select->get_table_name()
                                      : $alias_details['table'];

                  // the table name may be an alias to a join in the modifier
                  if( $modifier->has_join( $current_table_name ) )
                    $current_table_name = $modifier->get_alias_table( $current_table_name );
                }
              }
              else if( static::column_exists( $column ) ) $current_table_name = $table_name;

              if( is_null( $type ) )
              {
                // we come here if the column is an alias in the select but has no type,
                // or the column exists in the local (static) table's column list
                if( static::db()->column_exists( $current_table_name, $current_column_name ) )
                  $type = static::db()->get_column_variable_type( $current_table_name, $current_column_name );
                else if( '_count' == substr( $column, -6 ) ) $type = 'integer';
              }

              if( !is_null( $type ) && 'string' != $type && 'datetime' != $type && 'timestamp' != $type )
                settype( $columns[$column], $type );
            }
          }
        }
      }
      else // all data comes from the current table
      {
        if( $select->has_column( '*' ) )
        {
          $columns = $this->passive_column_values;
        }
        else
        {
          foreach( array_keys( $this->passive_column_values ) as $column )
            if( $select->has_column( $column ) || $select->has_table_column( $table_name, $column ) )
              $columns[$column] = $this->passive_column_values[$column];
        }
      }
    }

    // apply the active values and convert datetime objects back into strings
    if( is_array( $columns ) )
    {
      foreach( array_keys( $columns ) as $column )
      {
        if( array_key_exists( $column, $this->active_column_values ) )
          $columns[$column] = $this->active_column_values[$column];

        if( array_key_exists( $column, $this->passive_column_values ) &&
            $columns[$column] instanceof \DateTime )
        {
          $type = static::db()->get_column_data_type( $table_name, $column );
          if( 'datetime' == $type || 'timestamp' == $type )
          {
            // convert timestamps to server time
            if( 'timestamp' == $type )
              $columns[$column]->setTimezone( new \DateTimeZone( 'UTC' ) );
            $columns[$column] = $columns[$column]->format( 'Y-m-d H:i:s' );
          }
          else if( 'date' == $type ) $columns[$column] = $columns[$column]->format( 'Y-m-d' );
          else if( 'time' == $type ) $columns[$column] = $columns[$column]->format( 'H:i:s' );
        }
      }

      reset( $columns );
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
   *              current and foreign <record> by removing the corresponding row from the joining
   *              "has" table.
   * @method null replace_<record>() Given an array of ids, this method replaces all associations
   *              between the current and foreign <record> with the given array in the joining
   *              "has" table.
   */
  public function __call( $name, $args )
  {
    $return_value = NULL;

    // set up regular expressions
    $start = '/^add_|remove_|replace_|get_/';
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
        sprintf( 'Call to undefined function: %s::%s() (foreign table "%s" does not exist)',
                 get_called_class(),
                 $name,
                 $subject ),
        __METHOD__ );

    if( 'add' == $action )
    { // calling: add_<record>( $ids )
      // make sure the first argument is an integer or non-empty array of ids
      if( 1 != count( $args ) ||
          is_object( $args[0] ) ||
          ( is_array( $args[0] ) && 0 == count( $args[0] ) ) )
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
          ( is_array( $args[0] ) && 0 == count( $args[0] ) ) )
        throw lib::create( 'exception\argument', 'args', $args, __METHOD__ );

      $ids = $args[0];
      $this->remove_records( $subject, $ids );
      return;
    }
    else if( 'replace' == $action )
    { // calling: replace_<record>( $ids )
      // make sure the first argument is an integer or an array of ids
      if( 1 != count( $args ) ||
          is_object( $args[0] ) )
        throw lib::create( 'exception\argument', 'args', $args, __METHOD__ );

      $id = $args[0];
      $this->replace_records( $subject, $id );
      return;
    }
    else if( 'get' == $action )
    {
      // get the end of the function name
      $sub_action = preg_match( $end, $name, $match ) ? substr( $match[0], 1 ) : false;

      if( !$sub_action )
      {
        // calling: get_<record>()
        return $this->get_record( $subject );
      }
      else
      {
        if( 'list' == $sub_action )
        { // calling: get_<record>_list( $select = NULL, $modifier = NULL )
          return $this->get_record_list(
            $subject,
            0 < count( $args ) && !is_null( $args[0] ) ? $args[0] : NULL,   // select
            1 < count( $args ) && !is_null( $args[1] ) ? $args[1] : NULL ); // modifier
        }
        else if( 'object_list' == $sub_action )
        { // calling: get_<record>_object_list( $modifier = NULL )
          return $this->get_record_object_list(
            $subject,
            0 < count( $args ) && !is_null( $args[0] ) ? $args[0] : NULL ); // modifier
        }
        else if( 'count' == $sub_action )
        { // calling: get_<record>_count( $modifier = NULL )
          return $this->get_record_count(
            $subject,
            0 < count( $args ) && !is_null( $args[0] ) ? $args[0] : NULL,    // modifier
            1 < count( $args ) && !is_null( $args[1] ) ? $args[1] : false ); // distinct bool
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
    $foreign_key_name = $record_type.'_id';

    // make sure this table has the correct foreign key
    if( !static::column_exists( $foreign_key_name ) )
    {
      log::warning( 'Tried to get invalid record type: '.$record_type );
      return NULL;
    }

    // create the record using the foreign key
    $record = NULL;
    $foreign_key_value = $this->{ $foreign_key_name };
    if( !is_null( $foreign_key_value ) )
      $record = lib::create( 'database\\'.$record_type, $foreign_key_value );

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
   * @param bool $distinct Whether to count only distinct primary keys for the joining table (only used when
   *                       return_alternate is 'count')
   * @return array( associative or array ) | int
   * @access protected
   */
  protected function get_record_list(
    $record_type, $select = NULL, $modifier = NULL, $return_alternate = '', $distinct = false )
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
    $full_primary_key_name = sprintf( '%s.%s', $table_name, static::$primary_key_name );
    $foreign_class_name = lib::get_class_name( 'database\\'.$record_type );

    // check the primary key value
    $primary_key_value = $this->passive_column_values[static::$primary_key_name];
    if( is_null( $primary_key_value ) )
    {
      log::warning( 'Tried to query record with no primary key.' );
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
          $modifier->join( $table_name, $column_name, $full_primary_key_name );
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
          $modifier->cross_join( $table_name, $joining_primary_key_name, $full_primary_key_name, NULL, true );
          $modifier->cross_join( $joining_table_name, $foreign_key_name, $joining_foreign_key_name, NULL, true );
        }
        $modifier->where( $full_primary_key_name, '=', $primary_key_value );
      }

      if( 'count' == $return_alternate )
      {
        $return_value = $foreign_class_name::count( $modifier, $distinct );
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
   * @param bool $distinct Whether to count only distinct primary keys for the joining table
   * @return associative array
   * @access protected
   */
  public function get_record_count( $record_type, $modifier = NULL, $distinct  = false )
  {
    return $this->get_record_list( $record_type, NULL, $modifier, 'count', $distinct );
  }

  /**
   * Given an array of ids, this method adds associations between the current and foreign record
   * by adding rows into the joining "has" table.
   * This method is used to add child records for many-to-many relationships.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $record_type The type of record.
   * @param int|array(int) $ids A single or array of primary key values for the record(s) being added.
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
    $table_name = static::get_table_name();

    // check the primary key value
    $primary_key_value = $this->passive_column_values[static::$primary_key_name];
    if( is_null( $primary_key_value ) )
    {
      log::warning( 'Tried to query record with no primary key.' );
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
                 $table_name ) );
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
               $table_name,
               $record_type,
               $values ) );
  }

  /**
   * Given an id, this method removes the association between the current and record by removing
   * the corresponding row from the joining "has" table.
   * This method is used to remove child records from one-to-many or many-to-many relationships.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $record_type The type of record.
   * @param int|array(int) $ids A single or array of primary key values for the record(s) being added.
   *                       If NULL then all records will be removed.
   * @access protected
   */
  protected function remove_records( $record_type, $ids )
  {
    // warn if we are in read-only mode
    if( $this->read_only )
    {
      log::warning(
        'Tried to remove '.$foreign_table_name.' records to read-only record.' );
      return;
    }

    // check the primary key value
    $primary_key_value = $this->passive_column_values[static::$primary_key_name];
    if( is_null( $primary_key_value ) )
    {
      log::warning( 'Tried to query record with no primary key.' );
      return;
    }

    $table_name = static::get_table_name();

    // if ids is not an array then create a single-element array with it
    if( !is_null( $ids ) && !is_array( $ids ) ) $ids = array( $ids );

    // this method varies depending on the relationship type
    $relationship_class_name = lib::get_class_name( 'database\relationship' );
    $relationship = static::get_relationship( $record_type );
    if( $relationship_class_name::NONE == $relationship )
    {
      log::err(
        sprintf( 'Tried to remove a %s from a %s, but there is no relationship between the two.',
                 $record_type,
                 $table_name ) );
    }
    else if( $relationship_class_name::ONE_TO_ONE == $relationship )
    {
      log::err(
        sprintf( 'Tried to remove a %s from a %s, but there is a '.
                 'one-to-one relationship between the two.',
                 $record_type,
                 $table_name ) );
    }
    else if( $relationship_class_name::ONE_TO_MANY == $relationship )
    {
      $modifier = lib::create( 'database\modifier' );
      $column_name = sprintf( '%s.%s_id', $record_type, $table_name );
      $modifier->where( $column_name, '=', $primary_key_value );
      if( !is_null( $ids ) ) $modifier->where( 'id', 'IN', $ids );

      static::db()->execute(
        sprintf( 'DELETE FROM %s %s',
                 $record_type,
                 $modifier->get_sql() ) );
    }
    else if( $relationship_class_name::MANY_TO_MANY == $relationship )
    {
      $joining_table_name = static::get_joining_table_name( $record_type );

      $modifier = lib::create( 'database\modifier' );
      $column_name = sprintf( '%s.%s_id', $joining_table_name, $table_name );
      $modifier->where( $column_name, '=', $primary_key_value );

      if( !is_null( $ids ) )
      {
        $column_name = sprintf( '%s.%s_id', $joining_table_name, $record_type );
        $modifier->where( $column_name, 'IN', $ids );
      }

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
                 $table_name,
                 $record_type ) );
    }
  }

  /**
   * Given an array of ids, this method replaces all associations between the current and foreign record
   * with the given ids into the joining "has" table.
   * This method is used to replace child records for many-to-many relationships.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $record_type The type of record.
   * @param int|array(int) $ids A single or array of primary key values for the record(s) being added.
   * @access protected
   */
  protected function replace_records( $record_type, $ids )
  {
    // warn if we are in read-only mode
    if( $this->read_only )
    {
      log::warning(
        'Tried to replace '.$record_type.' records to read-only record.' );
      return;
    }

    $this->remove_records( $record_type, NULL );
    if( !is_array( $ids ) || ( is_array( $ids ) && 0 < count( $ids ) ) )
      $this->add_records( $record_type, $ids );
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

    $table_name = static::get_table_name();
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
        $select->add_column( static::$primary_key_name );
      }
      else
      {
        $select->add_all_table_columns();
      }
    }

    // select this table if one hasn't been selected yet
    if( is_null( $select->get_table_name() ) ) $select->from( $table_name );

    if( 'count' == $return_alternate )
    {
      $sql = sprintf( '%s %s',
                      $select->get_sql(),
                      is_null( $modifier ) ? '' : $modifier->get_sql( true ) );

      // if the modifier has a group statement then we want the number of returned rows
      $return_value = !is_null( $modifier ) && 0 < count( $modifier->get_group_columns() )
                    ? count( static::db()->get_all( $sql ) )
                    : intval( static::db()->get_one( $sql ) );
    }
    else
    {
      if( is_null( $modifier ) ) $modifier = lib::create( 'database\modifier' );
      $sql = sprintf( '%s %s',
                      $select->get_sql(),
                      is_null( $modifier ) ? '' : $modifier->get_sql() );
      $return_value = static::db()->get_all( $sql );
      if( 'object' == $return_alternate )
      { // convert ids to records
        $records = array();
        foreach( $return_value as $row ) $records[] = new static( $row[static::$primary_key_name] );
        $return_value = $records;
      }
      else
      { // convert data types
        foreach( $return_value as $index => $row )
        {
          foreach( $row as $column => $value )
          {
            if( !is_null( $value ) )
            {
              // see if the column is an alias in the select object
              $type = NULL;
              $alias_details = NULL;
              $current_column_name = $column;
              $current_table_name = NULL;
              if( $select->has_alias( $column ) )
              {
                $alias_details = $select->get_alias_details( $column );
                $type = $alias_details['type'];
                if( is_null( $type ) )
                {
                  $current_column_name = $alias_details['column'];
                  $current_table_name = 0 == strlen( $alias_details['table'] )
                                      ? $select->get_table_name()
                                      : $alias_details['table'];

                  // the table name may be an alias to a join in the modifier
                  if( $modifier->has_join( $current_table_name ) )
                    $current_table_name = $modifier->get_alias_table( $current_table_name );
                }
              }
              else if( static::column_exists( $column ) ) $current_table_name = $table_name;

              if( is_null( $type ) )
              {
                // we come here if the column is an alias in the select but has no type,
                // or the column exists in the local (static) table's column list
                if( static::db()->column_exists( $current_table_name, $current_column_name ) )
                  $type = static::db()->get_column_variable_type( $current_table_name, $current_column_name );
                else if( '_count' == substr( $column, -6 ) ) $type = 'integer';
              }

              if( !is_null( $type ) && 'string' != $type && 'datetime' != $type && 'timestamp' != $type )
                settype( $return_value[$index][$column], $type );
            }
          }
        }
      }
    }

    if( is_array( $return_value ) ) reset( $return_value );
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
   * @param bool $distinct Whether to count only distinct primary keys for this table
   * @return int
   * @static
   * @access public
   */
  public static function count( $modifier = NULL, $distinct = false )
  {
    $select = NULL;
    if( $distinct )
    { // add a count(distinct) to the select
      $select = lib::create( 'database\select' );
      $select->add_column(
        sprintf( 'COUNT( DISTINCT %s.%s )', static::get_table_name(), static::$primary_key_name ),
        'total',
        false );
    }
    return static::select( $select, $modifier, 'count' );
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
    $table_name = static::get_table_name();
    $record = NULL;

    // if the column is the primary key then there's no need to search for unique keys
    if( static::$primary_key_name == $column ||
        ( is_array( $column ) && 1 == count( $column ) && static::$primary_key_name == $column[0] ) )
      return new static( is_array( $value ) ? current( $value ) : $value );

    // create an associative array from the column/value arguments and sort
    if( is_array( $column ) && is_array( $value ) )
      foreach( $column as $index => $col ) $columns[$col] = $value[$index];
    else $columns[$column] = $value;
    ksort( $columns );

    // make sure the column(s) complete a unique key
    $found = false;
    foreach( static::db()->get_unique_keys( $table_name ) as $unique_key )
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
      throw lib::create( 'exception\argument', 'column', $column, __METHOD__ );
    }
    else
    {
      $select = lib::create( 'database\select' );
      $select->from( $table_name );
      $select->add_column( static::$primary_key_name );
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
    $values = NULL;
    if( 'enum' == static::db()->get_column_data_type( static::get_table_name(), $column_name ) )
    {
      // match all strings in single quotes, then cut out the quotes from the match and return them
      $type = static::db()->get_column_type( static::get_table_name(), $column_name );
      preg_match_all( "/'[^']+'/", $type, $matches );
      $values = array();
      foreach( current( $matches ) as $match ) $values[] = substr( $match, 1, -1 );
      reset( $values );
    }

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
    // make sure the column exists
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
   * @return string
   * @static
   * @access public
   */
  public static function column_exists( $column_name )
  {
    return static::db()->column_exists( static::get_table_name(), $column_name );
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
   * Holds all table column values in an associative array where keys are the column names and values
   * are the column values.  These values only change of the save() method is called at which time all
   * active values overwrite passive values.
   * @var array
   * @access private
   */
  private $passive_column_values = array();

  /**
   * Holds all modified table column values in an associative array where keys are the column names and
   * values are the column values.  These values change whenever the active record (object) is changed.
   * Column values will only appear in this array when they have been changed and are different from the
   * passive values.
   * 
   * @var array
   * @access private
   */
  private $active_column_values = array();

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
}
