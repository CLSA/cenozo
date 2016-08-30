<?php
/**
 * site.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * site: record
 */
class site extends record
{
  /**
   * Override parent method if identifier is 0 (get record from session)
   */
  public static function get_record_from_identifier( $identifier )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $session = lib::create( 'business\session' );

    // session objects can be loaded by using the identifier 0
    return 0 == $identifier ? $session->get_site() : parent::get_record_from_identifier( $identifier );
  }

  /**
   * Override parent method
   */
  public function save()
  {
    // source the region if the postcode has changed
    if( $this->has_column_changed( 'postcode' ) ) $this->source_postcode();

    // make sure the site is valid
    if( !$this->is_valid() )
      throw lib::create( 'exception\notice',
        'Unable to save site as requested. The postcode and region are not valid.',
        __METHOD__ );

    parent::save();
  }

  /**
   * Override parent method
   */
  public function delete()
  {
    // first remove all application links
    $application_sel = lib::create( 'database\select' );
    $application_sel->add_table_column( 'application', 'id' );
    $application_id_list = array();
    foreach( $this->get_application_list( $application_sel ) as $row )
      $this->remove_application( $row['id'] );
    parent::delete();
  }

  /**
   * Add space in postcodes if needed by overriding the magic __set method
   * @author Patrick Emond <emondpd@mcmaster.ca>
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
   * Gives a complete name for the site.
   * 
   * @author Patrick Emond <emondpd@mcamster.ca>
   * @access public
   */
  public function get_full_name()
  {
    return $this->name;
  }

  /**
   * Adds a list of users to the site with the given role.
   * 
   * @author Patrick Emond <emondpd@mcamster.ca>
   * @param int $user_id_list The users to add.
   * @param int $role_id The role to add them under.
   * @throws exeception\argument
   * @access public
   */
  public function add_access( $user_id_list, $role_id )
  {
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to add access to site with no primary key.' );
      return;
    }

    // make sure the user id list argument is a non-empty array of ids
    if( !is_array( $user_id_list ) || 0 == count( $user_id_list ) )
      throw lib::create( 'exception\argument', 'user_id_list', $user_id_list, __METHOD__ );

    // make sure the role id argument is valid
    if( 0 >= $role_id )
      throw lib::create( 'exception\argument', 'role_id', $role_id, __METHOD__ );

    $database_class_name = lib::get_class_name( 'database\database' );

    $value_list = array();
    foreach( $user_id_list as $id )
      $value_list[] = sprintf( '(NULL, %s, %s, %s)',
                               static::db()->format_string( $id ),
                               static::db()->format_string( $role_id ),
                               static::db()->format_string( $this->id ) );

    static::db()->execute(
      sprintf( 'INSERT IGNORE INTO access (create_timestamp, user_id, role_id, site_id)'."\n".
               'VALUES %s',
               implode( ",\n       ", $values ) ) );
  }

  /**
   * Removes a list of users to the site who have the given role.
   * 
   * @author Patrick Emond <emondpd@mcamster.ca>
   * @param int $access_id The access record to remove.
   * @access public
   */
  public function remove_access( $access_id )
  {
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to remove access from site with no primary key.' );
      return;
    }

    $db_access = lib::create( 'database\access', $access_id );
    $db_access->delete();
  }

  /**
   * Convenience method which returns the setting record for this site
   * 
   * @author Patrick Emond <emondpd@mcamster.ca>
   * @return database\setting
   * @access public
   */
  public function get_setting()
  {
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to get setting for site with no primary key.' );
      return NULL;
    }

    $setting_class_name = lib::get_class_name( 'database\setting' );
    return $setting_class_name::get_unique_record( 'site_id', $this->id );
  }

  /**
   * Determines if the site is valid by making sure all site-based manditory fields
   * are filled and checking for postcode-region mismatches.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @return boolean
   * @access public
   */
  public function is_valid()
  {
    $valid = true;

    if( !is_null( $this->postcode ) )
    {
      // make sure postcode is in A0A 0A0 or 00000 format
      if( 0 == preg_match( '/([A-Za-z][0-9][A-Za-z]) ([0-9][A-Za-z][0-9])/', $this->postcode ) &&
          0 == preg_match( '/[0-9]{5}/', $this->postcode ) ) $valid = false;
      else
      {
        // look up the postal code for the correct region
        $postcode_class_name = lib::get_class_name( 'database\postcode' );
        $db_postcode = $postcode_class_name::get_match( $this->postcode );
        $valid = !is_null( $db_postcode ) ? $db_postcode->region_id == $this->region_id : false;
      }
    }

    return $valid;
  }

  /**
   * Sets the region column based on the postcode.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function source_postcode()
  {
    $postcode_class_name = lib::get_class_name( 'database\postcode' );
    if( !is_null( $this->postcode ) )
    {
      $db_postcode = $postcode_class_name::get_match( $this->postcode );
      if( !is_null( $db_postcode ) ) $this->region_id = $db_postcode->region_id;
    }
  }
}
