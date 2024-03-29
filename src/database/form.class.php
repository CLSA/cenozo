<?php
/**
 * form.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

/**
 * form: record
 */
class form extends record
{
  /**
   * Returns the filesystem location of the form
   * 
   * @return string
   * @access public
   */
  public function get_filename()
  {
    // check the primary key value
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to query form with no primary key.' );
      return NULL;
    }

    $padded_id = str_pad( $this->id, 7, '0', STR_PAD_LEFT );
    $filename = sprintf( '%s/%s/%s/%s/%s.pdf',
                         FORM_PATH,
                         $this->get_form_type()->name,
                         substr( $padded_id, 0, 3 ),
                         substr( $padded_id, 3, 2 ),
                         substr( $padded_id, 5 ) );

    return $filename;
  }

  /**
   * Adds consent data and associates it to this form
   * 
   * @param string $type The type of consent (see consent_type.name)
   * @param array $consent An associative array containing "datetime" and "accept" keys
   * @param string $note A note to add to the consent record
   * @return database\consent The consent record created by this method
   * @access public
   */
  public function add_consent( $type, $consent, $note = NULL )
  {
    $consent_type_class_name = lib::get_class_name( 'database\consent_type' );

    // Determine the datetime: note that if the time is midnight then we only have the date and not the time so we
    // must advance by 12 hours so that UTC conversion doesn't cause the date to show on the wrong day
    $datetime = array_key_exists( 'datetime', $consent ) ? $consent['datetime'] : $this->date;
    if( '00:00:00' == $datetime->format( 'H:i:s' ) ) $datetime->setTime( 12, 0 );

    $db_consent_type = $consent_type_class_name::get_unique_record( 'name', $type );
    $consent_mod = lib::create( 'database\modifier' );
    $consent_mod->where( 'consent_type_id', '=', $db_consent_type->id );
    $consent_mod->where( 'accept', '=', $consent['accept'] );
    $consent_mod->where( 'written', '=', true );
    $consent_mod->where( 'datetime', '=', $datetime );
    $consent_list = $this->get_participant()->get_consent_object_list( $consent_mod );
    $db_consent = current( $consent_list );

    if( !$db_consent )
    {
      $db_consent = lib::create( 'database\consent' );
      $db_consent->participant_id = $this->participant_id;
      $db_consent->consent_type_id = $db_consent_type->id;
      $db_consent->accept = $consent['accept'];
      $db_consent->written = true;
      $db_consent->datetime = $datetime;
      $db_consent->note = $note;
      $db_consent->save();
    }

    $this->add_association( 'consent', $db_consent->id );

    return $db_consent;
  }

  /**
   * Adds proxy consent data and associates it to this form
   * 
   * @param string $type The type of consent (see consent_type.name)
   * @param int $alternate_id The primary key of the alternate associated with the consent.
   * @param array $alternate_consent An associative array containing "datetime" and "accept" keys
   * @return database\consent The consent record created by this method
   * @access public
   */
  public function add_proxy_consent( $type, $alternate_id, $alternate_consent, $note = NULL )
  {
    // same as a consent form but associate the alternate as well
    $alternate_consent_type_class_name = lib::get_class_name( 'database\alternate_consent_type' );

    // Determine the datetime: note that if the time is midnight then we only have the date and not the time so we
    // must advance by 12 hours so that UTC conversion doesn't cause the date to show on the wrong day
    $datetime = array_key_exists( 'datetime', $alternate_consent ) ? $alternate_consent['datetime'] : $this->date;
    if( '00:00:00' == $datetime->format( 'H:i:s' ) ) $datetime->setTime( 12, 0 );

    $db_alternate_consent_type = $alternate_consent_type_class_name::get_unique_record( 'name', $type );
    if( is_null( $db_alternate_consent_type ) )
    {
      throw lib::create( 'exception\argument', 'type', $type, __METHOD__ );
    }

    try
    {
      $db_alternate = lib::create( 'database\alternate', $alternate_id );
    }
    catch( \cenozo\exception\runtime $e )
    {
      // denote that the alternate_id argument is the problem
      throw lib::create( 'exception\argument', 'alternate_id', $alternate_id, __METHOD__, $e );
    }

    $alternate_consent_mod = lib::create( 'database\modifier' );
    $alternate_consent_mod->where( 'alternate_consent_type_id', '=', $db_alternate_consent_type->id );
    $alternate_consent_mod->where( 'accept', '=', $alternate_consent['accept'] );
    $alternate_consent_mod->where( 'written', '=', true );
    $alternate_consent_mod->where( 'datetime', '=', $datetime );
    $alternate_consent_list = $db_alternate->get_alternate_consent_object_list( $alternate_consent_mod );
    $db_alternate_consent = current( $alternate_consent_list );

    if( !$db_alternate_consent )
    {
      $db_alternate_consent = lib::create( 'database\alternate_consent' );
      $db_alternate_consent->alternate_id = $alternate_id;
      $db_alternate_consent->alternate_consent_type_id = $db_alternate_consent_type->id;
      $db_alternate_consent->accept = $alternate_consent['accept'];
      $db_alternate_consent->written = true;
      $db_alternate_consent->datetime = $datetime;
      $db_alternate_consent->note = $note;
      $db_alternate_consent->save();
    }

    $this->add_association( 'alternate_consent', $db_alternate_consent->id );
    $this->add_association( 'alternate', $alternate_id );
  }

  /**
   * Adds hin data and associates it to this form
   * 
   * @param string $type The type of hin (see hin_type.name)
   * @param array $hin An associative array containing "datetime", "code" and "region_id" keys
   * @return database\hin The hin record created by this method
   * @access public
   */
  public function add_hin( $hin )
  {
    $datetime = array_key_exists( 'datetime', $hin ) ? $hin['datetime'] : $this->date;

    $hin_mod = lib::create( 'database\modifier' );
    $hin_mod->where( 'datetime', '=', $datetime );
    $hin_list = $this->get_participant()->get_hin_object_list( $hin_mod );
    $db_hin = current( $hin_list );

    if( !$db_hin )
    {
      $db_hin = lib::create( 'database\hin' );
      $db_hin->participant_id = $this->participant_id;
      $db_hin->code = $hin['code'];
      $db_hin->region_id = $hin['region_id'];
      $db_hin->datetime = $datetime;
      $db_hin->save();
    }

    $this->add_association( 'hin', $db_hin->id );

    return $db_hin;
  }

  /**
   * Adds alternate data and associates it to this form
   * 
   * @param array $data An associative array containing all alternate data:
   *          alternate_type_list (list of strings containing alternate type names)
   *          first_name
   *          last_name
   *          global_note
   *          address_international (optional)
   *          apartment_number
   *          street_number
   *          street_name
   *          box
   *          rural_route
   *          address_other
   *          city
   *          region_id
   *          postcode
   *          international_region (optional)
   *          international_country_id (optional)
   *          address_note
   *          phone
   *          phone_note
   * @return database\alternate The alternate record created by this method
   * @access public
   */
  public function add_alternate( $data )
  {
    $util_class_name = lib::get_class_name( 'util' );
    $alternate_class_name = lib::get_class_name( 'database\alternate' );
    $alternate_type_class_name = lib::get_class_name( 'database\alternate_type' );
    $user_class_name = lib::get_class_name( 'database\user' );
    $setting_manager = lib::create( 'business\setting_manager' );

    // if this participant already has an alternate with the same first and last name then
    // overwrite instead of creating a new record
    $alternate_mod = lib::create( 'database\modifier' );
    $alternate_mod->where( 'participant_id', '=', $this->participant_id );
    $alternate_mod->where( 'first_name', '=', $data['first_name'] );
    $alternate_mod->where( 'last_name', '=', $data['last_name'] );
    $alternate_list = $alternate_class_name::select_objects( $alternate_mod );
    $db_alternate = current( $alternate_list );

    $new_alternate = false;
    if( !$db_alternate )
    { // create a new alternate if no match was found
      $db_alternate = lib::create( 'database\alternate' );
      $new_alternate = true;
    }
    else
    {
      // replace any addresses (we'll look for duplicate phone numbers below)
      foreach( $db_alternate->get_address_object_list() as $db_address ) $db_address->delete();
    }

    $db_alternate->active = true;
    $db_alternate->participant_id = $this->participant_id;
    $db_alternate->first_name = $data['first_name'];
    $db_alternate->last_name = $data['last_name'];
    $db_alternate->association = 'Unknown';
    if( array_key_exists( 'global_note', $data ) && !is_null( $data['global_note'] ) )
      $db_alternate->global_note = $data['global_note'];
    $db_alternate->save();

    // now add the requested alternate types
    $alternate_type_id_list = array();
    foreach( $data['alternate_type_list'] as $type )
    {
      $db_alternate_type = $alternate_type_class_name::get_unique_record( 'name', $type );
      if( is_null( $db_alternate_type ) ) log::warning( sprintf( 'Tried to add invalid alternate type "%s" to form.', $type ) );
      else $alternate_type_id_list[] = $db_alternate_type->id;
    }

    if( 0 < count( $alternate_type_id_list ) ) $db_alternate->add_alternate_type( $alternate_type_id_list );

    $this->add_association( 'alternate', $db_alternate->id );

    // import data to the address table
    $address = $util_class_name::parse_address(
      $data['apartment_number'],
      $data['street_number'],
      $data['street_name'],
      $data['box'],
      $data['rural_route'],
      $data['address_other']
    );

    $db_address = lib::create( 'database\address' );
    $db_address->alternate_id = $db_alternate->id;
    $db_address->active = true;
    $db_address->rank = 1;
    $db_address->international = array_key_exists( 'address_international', $data )
                               ? $data['address_international']
                               : false;
    $db_address->address1 = $address[0];
    $db_address->address2 = $address[1];
    $db_address->city = $data['city'];
    $db_address->region_id = $data['region_id'];
    $postcode = 6 == strlen( $data['postcode'] )
              ? sprintf( '%s %s', substr( $data['postcode'], 0, 3 ), substr( $data['postcode'], 3, 3 ) )
              : $data['postcode'];
    $db_address->postcode = $postcode;

    if( $db_address->international )
    {
      if( array_key_exists( 'international_region', $data ) )
        $db_address->international_region = $data['international_region'];
      if( array_key_exists( 'international_country_id', $data ) )
        $db_address->international_country_id = $data['international_country_id'];
    }

    $db_address->source_postcode();
    $db_address->note = $data['address_note'];
    $db_address->save();

    // import data to the phone table
    $db_phone = NULL;
    if( !$new_alternate )
    {
      // see if the number already exists
      $phone_mod = lib::create( 'database\modifier' );
      $phone_mod->where( 'number', '=', $data['phone'] );
      $phone_mod->where(
        'international',
        '=',
        array_key_exists( 'phone_international', $data ) ? $data['phone_international'] : false
      );
      $phone_mod->order( 'rank' );
      $phone_list = $db_alternate->get_phone_object_list( $phone_mod );

      if( 1 == count( $phone_list ) ) $db_phone = current( $phone_list );
      else if( 1 < count( $phone_list ) )
      {
        // use the first active number
        foreach( $phone_list as $record )
        {
          if( $record->active )
          {
            $db_phone = $record;
            break;
          }
        }

        // if none are active then just use the first one
        if( is_null( $db_phone ) ) $db_phone = current( $phone_list );
      }
    }

    if( is_null( $db_phone ) )
    {
      $db_phone = lib::create( 'database\phone' );
      $db_phone->alternate_id = $db_alternate->id;
      $db_phone->type = 'other';
      $db_phone->rank = 1;
      $db_phone->international = array_key_exists( 'phone_international', $data )
                               ? $data['phone_international']
                               : false;
      $db_phone->number = $data['phone'];
    }

    $db_phone->active = true;
    $db_phone->note = $data['phone_note'];
    $db_phone->save();

    return $db_alternate;
  }

  /**
   * Save the form to disk
   * 
   * @param binary $data The form's raw file data
   * @return boolean Whether the operation is successful
   * @access public
   */
  public function write_file( $data )
  {
    $directory = dirname( $this->get_filename() );
    if( !is_dir( $directory ) ) mkdir( $directory, 0777, true );
    return false !== file_put_contents( $this->get_filename(), $data );
  }

  /**
   * Copy the form from the disk
   * 
   * @param string $filename A local file to copy as this form's file
   * @return boolean Whether the operation is successful
   * @access public
   */
  public function copy_file( $filename )
  {
    $directory = dirname( $this->get_filename() );
    if( !is_dir( $directory ) ) mkdir( $directory, 0777, true );
    return @copy( $filename, $this->get_filename() );
  }

  /**
   * Used internall to add associated records to this form
   * 
   * @param string $subject The table name of the associated record
   * @param integer $id The primary ID of the associated record
   * @access private
   */
  private function add_association( $subject, $id )
  {
    // check the primary key value
    if( is_null( $this->id ) )
    {
      log::warning( 'Tried to query form with no primary key.' );
      return NULL;
    }

    static::db()->execute( sprintf(
      'INSERT IGNORE INTO form_association'."\n".
      'SET form_id = %s,'."\n".
      '    subject = %s,'."\n".
      '    record_id = %s',
      static::db()->format_string( $this->id ),
      static::db()->format_string( $subject ),
      static::db()->format_string( $id ) )
    );
  }
}
