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
  public function get_keywords( $query )
  {
    $word_list = array();
    $quote_list = array();
    $pos = -1;

    // extract " delimited phrases (ignoring escaped quotes)
    while( false !== ( $pos = strpos( $query, '"', $pos+1 ) ) )
      if( '\\' != substr( $query, $pos-1, 1 ) ) $quote_list[] = $pos;

    // now extract all strings enclosed by quotes
    for( $i = 1; $i < count( $quote_list ); $i+=2 )
    {
      $p1 = $quote_list[$i-1];
      $p2 = $quote_list[$i];
      $word_list[] = substr( $query, $p1+1, $p2-$p1-1 );
      $query = substr( $query, 0, $p1 ).' '.substr( $query, $p2+1 );
    }

    // and clean up
    $word_list = array_filter(
      array_unique( array_merge( $word_list, explode( ' ', $query ) ) ),
      function( $w ) { return 1 < strlen( $w ); }
    );
    array_walk( $word_list, create_function( '&$w', '$w = trim( $w );' ) );
    sort( $word_list );

    return $word_list;
  }

  /**
   * TODO: document
   */
  public function search( $query )
  {
    $search_class_name = lib::get_class_name( 'database\search' );
    $setting_manager = lib::create( 'business\setting_manager' );
    $timeout = $setting_manager->get_setting( 'general', 'search_timeout' );

    // clean out expired searches
    $delete_mod = lib::create( 'database\modifier' );
    $delete_mod->where( 'datetime', '<', sprintf( 'UTC_TIMESTAMP() - INTERVAL %s', $timeout ), false );
    $search_class_name::db()->execute( 'DELETE FROM search '.$delete_mod->get_sql() );

    // for every keyword, check to see if the search exists and is still fresh
    foreach( $this->get_keywords( $query ) as $word )
    {
      $search_mod = lib::create( 'database\modifier' );
      $search_mod->where( 'query', '=', $word );
      if( 0 == $search_class_name::count( $search_mod ) ) $this->search_keyword( $word );
    }
  }

  /**
   * TODO: document
   */
  protected function search_keyword( $word )
  {
    $db = lib::create( 'business\session' )->get_database();

    // a base select object used by all selects below
    $base_sel = lib::create( 'database\select' );
    $base_sel->add_constant( 'NULL', 'create_timestamp', NULL, false );
    $base_sel->add_constant( $word, 'query' );
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
      $modifier->where( $column, 'LIKE', $word );

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
        $modifier->where( $column, 'LIKE', $word );

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
        $modifier->where( $column, 'LIKE', $word );
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
        $modifier->where( $column, 'LIKE', $word );
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
      $modifier->where( $column, 'LIKE', $word );
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
