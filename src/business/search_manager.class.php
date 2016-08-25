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
   * Returns a list of distinct keywords from a query string
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $query A raw query string
   * @return array A list of keywords (may be double-quote delimited)
   * @access public
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
   * Creates search results in the database
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $query A raw query string
   * @access public
   */
  public function search( $query )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $search_class_name = lib::get_class_name( 'database\search' );
    $setting_manager = lib::create( 'business\setting_manager' );
    $timeout = $setting_manager->get_setting( 'general', 'search_timeout' );

    // clean out expired searches
    $delete_mod = lib::create( 'database\modifier' );
    $delete_mod->where( 'datetime', '<', sprintf( 'UTC_TIMESTAMP() - INTERVAL %s MINUTE', $timeout ), false );
    $search_class_name::db()->execute( 'DELETE FROM search '.$delete_mod->get_sql() );

    // for every keyword, check to see if the search exists and is still fresh
    foreach( $this->get_keywords( $query ) as $word )
    {
      $search_mod = lib::create( 'database\modifier' );
      $search_mod->where( 'word', '=', $word );
      if( 0 == $search_class_name::count( $search_mod ) )
      {
        // create the search (a database trigger will fill in the search_results table)
        $db_search = lib::create( 'database\search' );
        $db_search->word = $word;
        $db_search->datetime = $util_class_name::get_datetime_object()->format( 'Y-m-d H:i:s' );
        $db_search->save();
      }
    }
  }
}
