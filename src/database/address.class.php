<?php
/**
 * address.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * address: record
 */
class address extends has_rank
{
  /**
   * Override parent method
   */
  public function save()
  {
    $db_role = lib::create( 'business\session' )->get_role();

    // if this is a new address and the region isn't set, source it
    // OR -- allow administrators to redefine an address by setting the postcode
    if( ( is_null( $this->id ) && is_null( $this->region_id ) ) || 3 <= $db_role->tier ) $this->source_postcode();

    // make sure the address is valid
    if( !$this->is_valid() )
    {
      $country = lib::create( 'business\session' )->get_application()->country;
      $message = sprintf(
        $this->international ?
        'international addresses may not have a region in %s.' :
        'local (non-international) addresses must have a region in %s and a valid postcode '.
        'belonging to the address\' region.',
        $country );
      throw lib::create( 'exception\notice',
        'Unable to save address as requested. Please note that '.$message,
        __METHOD__ );
    }

    // figure out whether alternate or participant is the rank parent
    static::$rank_parent = !is_null( $this->alternate_id ) ? 'alternate' : 'participant';
    parent::save();
    static::$rank_parent = NULL;
  }

  /**
   * Override parent method
   */
  public function delete()
  {
    // figure out whether alternate or participant is the rank parent
    static::$rank_parent = !is_null( $this->alternate_id ) ? 'alternate' : 'participant';
    parent::delete();
    static::$rank_parent = NULL;
  }

  /**
   * Add space in postcodes if needed by overriding the magic __set method
   * @param string $column_name The name of the column
   * @param mixed $value The value to set the contents of a column to
   * @throws exception\argument
   * @access public
   */
  public function __set( $column_name, $value )
  {
    if( 'postcode' == $column_name )
      $value = preg_replace_callback(
        '/([A-Za-z][0-9][A-Za-z]) ?([0-9][A-Za-z][0-9])/',
        function( $match ) { return strtoupper( sprintf( '%s %s', $match[1], $match[2] ) ); },
        $value );

    parent::__set( $column_name, $value );
  }

  /**
   * Extend parent method
   */
  public static function get_unique_record( $column, $value )
  {
    $record = NULL;

    // make use of the uq_alternate_id_participant_id_rank pseudo unique key
    if( is_array( $column ) && 2 == count( $column ) && in_array( 'rank', $column ) &&
        ( in_array( 'participant_id', $column ) || in_array( 'alternate_id', $column ) ) )
    {
      $select = lib::create( 'database\select' );
      $select->from( static::get_table_name() );
      $select->add_column( static::get_primary_key_name() );
      $modifier = lib::create( 'database\modifier' );
      foreach( $column as $index => $name ) $modifier->where( $name, '=', $value[$index] );

      // this returns null if no records are found
      $id = static::db()->get_one( sprintf( '%s %s', $select->get_sql(), $modifier->get_sql() ) );
      if( !is_null( $id ) ) $record = new static( $id );
    }
    else
    {
      $record = parent::get_unique_record( $column, $value );
    }

    return $record;
  }

  /**
   * Provides a string representation of the address
   * @return string
   */
  public function to_string()
  {
    $string = $this->address1;
    if( !is_null( $this->address2 ) ) $string .= sprintf( ' %s', $this->address2 );

    if( $this->international )
    {
      if( !is_null( $this->city ) ) $string .= sprintf( ', %s', $this->city );
      if( !is_null( $this->international_region ) ) $string .= sprintf( ', %s', $this->international_region );
      if( !is_null( $this->postcode ) ) $string .= sprintf( ', %s', $this->postcode );
      if( !is_null( $this->international_country ) ) $string .= sprintf( ', %s', $this->international_country );
    }
    else
    {
      $string .= sprintf(
        ', %s, %s, %s',
        $this->city,
        $this->get_region()->abbreviation,
        $this->postcode
      );
    }

    return $string;
  }

  /**
   * Sets the region, timezone offset and daylight savings columns based on the postcode.
   * @access public
   */
  public function source_postcode()
  {
    $postcode_class_name = lib::get_class_name( 'database\postcode' );
    if( !is_null( $this->postcode ) && !$this->international )
    {
      $db_postcode = $postcode_class_name::get_match( $this->postcode );
      if( !is_null( $db_postcode ) )
      {
        $this->region_id = $db_postcode->region_id;
        $this->timezone_offset = $db_postcode->timezone_offset;
        $this->daylight_savings = $db_postcode->daylight_savings;
      }
    }
  }

  /**
   * Determines if the address is valid by making sure all address-based manditory fields
   * are filled and checking for postcode-region mismatches.
   * @return boolean
   * @access public
   */
  public function is_valid()
  {
    $session = lib::create( 'business\session' );

    // if international then make sure the region doesn't belong to the application's country
    if( $this->international )
      return is_null( $this->region_id ) || $this->get_region()->country != $session->get_application()->country;

    // not international, make sure the region and postcode are set
    if( is_null( $this->region_id ) || is_null( $this->postcode ) ) return false;

    // make sure postcode is in A0A 0A0 or 00000 format
    if( 0 == preg_match( '/([A-Za-z][0-9][A-Za-z]) ([0-9][A-Za-z][0-9])/', $this->postcode ) &&
        0 == preg_match( '/[0-9]{5}/', $this->postcode ) ) return false;

    // look up the postal code for the correct region
    $postcode_class_name = lib::get_class_name( 'database\postcode' );
    $db_postcode = $postcode_class_name::get_match( $this->postcode );
    return !is_null( $db_postcode ) ? $db_postcode->region_id == $this->region_id : false;
  }

  /**
   * Returns this address' timezone name
   * @return string
   * @access public
   */
  public function get_timezone_name()
  {
    $util_class_name = lib::get_class_name( 'util' );
    return $util_class_name::get_timezone_name( $this->timezone_offset, $this->daylight_savings );
  }

  /**
   * Returns the address' timezone as a DateTimeZone object
   * @access public
   */
  public function get_timezone_object()
  {
    return new \DateTimeZone( $this->get_timezone_name() );
  }

  /**
   * The type of record which the record has a rank for.
   * @var string
   * @access protected
   * @static
   */
  protected static $rank_parent = NULL;
}
