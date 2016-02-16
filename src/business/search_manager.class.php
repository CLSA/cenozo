<?php
/**
 * search_manager.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\business;
use cenozo\lib, cenozo\log;

/**
 * The search manager is responsible for database searches
 */
class search_manager extends \cenozo\singleton
{
  /**
   * Constructor.
   * 
   * Since this class uses the singleton pattern the constructor is never called directly.  Instead
   * use the {@link singleton} method.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function __construct() {}

  /**
   * TODO: document
   */
  public function search( $query )
  {
    $search_class_name = lib::get_class_name( 'database\search' );
    $setting_manager = lib::create( 'business\setting_manager' );
    $timeout = $setting_manager->get_setting( 'general', 'search_timeout' );

    // check to see if the search exists and is still fresh
    $search_mod = lib::create( 'database\modifier' );
    $search_mod->where( 'query', '=', $query );
    $search_mod->where( 'datetime', '>', sprintf( 'UTC_TIMESTAMP() - INTERVAL %s', $timeout ), false );
    if( 0 == $search_class_name::count( $search_mod ) )
    {
      $delete_mod = lib::create( 'database\modifier' );
      $delete_mod->where( 'query', '=', $query );
      $search_class_name::db()->execute( 'DELETE FROM search '.$delete_mod->get_sql() );
      $this->replace_search( $query );
    }
  }

  /**
   * TODO: document
   */
  protected function replace_search( $query )
  {
    $db = lib::create( 'business\session' )->get_database();

    // a base select object used by all selects below
    $base_sel = lib::create( 'database\select' );
    $base_sel->add_constant( 'NULL', 'create_timestamp', NULL, false );
    $base_sel->add_constant( $query, 'query' );
    $base_sel->add_constant( 'UTC_TIMESTAMP()', 'datetime', NULL, false );
    $base_sel->add_column( 'id' );

    // participant table
    /////////////////////////////////////////////////////////////////////////////////////
    $column_list = array( 'honorific', 'first_name', 'other_name', 'last_name', 'date_of_birth', 'email' );

    foreach( $column_list as $column )
    {
      $select = clone $base_sel;
      $select->from( 'participant' );
      $select->add_constant( 'participant', 'subject' );
      $select->add_constant( $column, 'column_name' );
      $select->add_column( 'id', 'participant_id' );
      if( 255 < $db->get_column_max_length( 'participant', $column ) )
      {
        $select->add_column(
          sprintf( 'IF( CHAR_LENGTH( %s ) > 255, CONCAT( SUBSTRING( %s, 1, 252 ), "..." ), %s ) ',
                   $column, $column, $column ),
          'value', false );
      }
      else $select->add_column( $column );

      $modifier = lib::create( 'database\modifier' );
      $modifier->where( $column, 'LIKE', $query );

      $sql = sprintf(
        'REPLACE INTO search( create_timestamp, query, datetime, record_id, '.
                             'subject, column_name, participant_id, value )'."\n".
        '%s %s',
        $select->get_sql(),
        $modifier->get_sql() );
      $db->execute( $sql );
    }

    // participant-related tables
    /////////////////////////////////////////////////////////////////////////////////////
    $table_list = array(
      array( 'name' => 'alternate', 'column_list' => array( 'first_name', 'last_name', 'association' ) ),
      array( 'name' => 'consent', 'column_list' => array( 'note' ) ),
      array( 'name' => 'hin', 'column_list' => array( 'code' ) )
    );

    foreach( $table_list as $table )
    {
      foreach( $table['column_list'] as $column )
      {
        $select = clone $base_sel;
        $select->from( $table['name'] );
        $select->add_constant( $table['name'], 'subject' );
        $select->add_constant( $column, 'column_name' );
        $select->add_column( 'participant_id' );
        if( 255 < $db->get_column_max_length( $table['name'], $column ) )
        {
          $select->add_column(
            sprintf( 'IF( CHAR_LENGTH( %s ) > 255, CONCAT( SUBSTRING( %s, 1, 252 ), "..." ), %s ) ',
                     $column, $column, $column ),
            'value', false );
        }
        else $select->add_column( $column );

        $modifier = lib::create( 'database\modifier' );
        $modifier->where( $column, 'LIKE', $query );

        $sql = sprintf(
          'REPLACE INTO search( create_timestamp, query, datetime, record_id, '.
                               'subject, column_name, participant_id, value )'."\n".
          '%s %s',
          $select->get_sql(),
          $modifier->get_sql() );
        $db->execute( $sql );
      }
    }

    // participant/alternate shared tables
    /////////////////////////////////////////////////////////////////////////////////////
    $table_list = array(
      array( 'name' => 'address',
             'column_list' => array( 'address1', 'address2', 'city', 'postcode', 'note' ) ),
      array( 'name' => 'phone',
             'column_list' => array( 'number', 'note' ) ),
      array( 'name' => 'note',
             'column_list' => array( 'note' ) )
    );

    foreach( $table_list as $table )
    {
      foreach( $table['column_list'] as $column )
      {
        // participant's record
        $select = clone $base_sel;
        $select->from( $table['name'] );
        $select->add_constant( $table['name'], 'subject' );
        $select->add_constant( $column, 'column_name' );
        $select->add_column( 'participant_id' );
        if( 255 < $db->get_column_max_length( $table['name'], $column ) )
        {
          $select->add_column(
            sprintf( 'IF( CHAR_LENGTH( %s ) > 255, CONCAT( SUBSTRING( %s, 1, 252 ), "..." ), %s ) ',
                     $column, $column, $column ),
            'value', false );
        }
        else $select->add_column( $column );

        $modifier = lib::create( 'database\modifier' );
        $modifier->where( $column, 'LIKE', $query );
        $modifier->where( 'participant_id', '!=', NULL ); // make sure it doesn't belong to an alternate

        $sql = sprintf(
          'REPLACE INTO search( create_timestamp, query, datetime, record_id, '.
                               'subject, column_name, participant_id, value )'."\n".
          '%s %s',
          $select->get_sql(),
          $modifier->get_sql() );
        $db->execute( $sql );

        // alternate's record
        $select = clone $base_sel;
        $select->from( $table['name'] );
        $select->add_constant( $table['name'], 'subject' );
        $select->add_constant( $column, 'column_name' );
        $select->add_column( 'alternate.participant_id', 'participant_id', false );
        if( 255 < $db->get_column_max_length( $table['name'], $column ) )
        {
          $select->add_column(
            sprintf( 'IF( CHAR_LENGTH( %s ) > 255, CONCAT( SUBSTRING( %s, 1, 252 ), "..." ), %s ) ',
                     $column, $column, $column ),
            'value', false );
        }
        else $select->add_column( $column );

        $modifier = lib::create( 'database\modifier' );
        $modifier->where( $column, 'LIKE', $query );
        // make sure it belongs to an alternate
        $modifier->join( 'alternate', $table['name'].'.alternate_id', 'alternate.id' );

        $sql = sprintf(
          'REPLACE INTO search( create_timestamp, query, datetime, record_id, '.
                               'subject, column_name, participant_id, value )'."\n".
          '%s %s',
          $select->get_sql(),
          $modifier->get_sql() );
        $db->execute( $sql );
      }
    }

    // event_address table
    /////////////////////////////////////////////////////////////////////////////////////
    $column_list = array( 'address1', 'address2', 'city', 'postcode' );

    foreach( $column_list as $column )
    {
      $select = clone $base_sel;
      $select->from( 'event_address' );
      $select->add_constant( 'event_address', 'subject' );
      $select->add_constant( $column, 'column_name' );
      $select->add_column( 'event.participant_id', 'participant_id', false );
      if( 255 < $db->get_column_max_length( 'event_address', $column ) )
      {
        $select->add_column(
          sprintf( 'IF( CHAR_LENGTH( %s ) > 255, CONCAT( SUBSTRING( %s, 1, 252 ), "..." ), %s ) ',
                   $column, $column, $column ),
          'value', false );
      }
      else $select->add_column( $column );

      $modifier = lib::create( 'database\modifier' );
      $modifier->where( $column, 'LIKE', $query );
      $modifier->join( 'event', 'event_address.event_id', 'event.id' );

      $sql = sprintf(
        'REPLACE INTO search( create_timestamp, query, datetime, record_id, '.
                             'subject, column_name, participant_id, value )'."\n".
        '%s %s',
        $select->get_sql(),
        $modifier->get_sql() );
      $db->execute( $sql );
    }
  }
}
