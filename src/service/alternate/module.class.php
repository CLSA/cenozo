<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\alternate;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cenozo\service\site_restricted_participant_module
{
  /**
   * Extend parent method
   */
  public function validate()
  {
    parent::validate();

    if( $this->service->may_continue() )
    {
      // make sure the application has access to the participant
      $db_application = lib::create( 'business\session' )->get_application();
      $db_alternate = $this->get_resource();
      if( !is_null( $db_alternate ) )
      {
        if( $db_application->release_based )
        {
          $modifier = lib::create( 'database\modifier' );
          $modifier->where( 'participant_id', '=', $db_alternate->participant_id );
          if( 0 == $db_application->get_participant_count( $modifier ) )
          {
            $this->get_status()->set_code( 404 );
            return;
          }
        }

        // restrict by site
        $db_restrict_site = $this->get_restricted_site();
        if( !is_null( $db_restrict_site ) )
        {
          $db_participant = $db_alternate->get_participant();
          if( !is_null( $db_participant ) && $db_participant->get_effective_site()->id != $db_restrict_site->id )
            $this->get_status()->set_code( 403 );
        }
      }
    }
  }

  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $db_application = lib::create( 'business\session' )->get_application();

    $modifier->join( 'participant', 'alternate.participant_id', 'participant.id' );

    // add empty values for address and phone number fields (they are only used when adding new alternates so they will be ignored)
    if( $select->has_column( 'alternate_type_id' ) ) $select->add_constant( NULL, 'alternate_type_id' );
    if( $select->has_column( 'phone_international' ) ) $select->add_constant( NULL, 'phone_international' );
    if( $select->has_column( 'phone_type' ) ) $select->add_constant( NULL, 'phone_type' );
    if( $select->has_column( 'phone_number' ) ) $select->add_constant( NULL, 'phone_number' );
    if( $select->has_column( 'phone_note' ) ) $select->add_constant( NULL, 'phone_note' );
    if( $select->has_column( 'address_international' ) ) $select->add_constant( NULL, 'address_international' );
    if( $select->has_column( 'address_address1' ) ) $select->add_constant( NULL, 'address_address1' );
    if( $select->has_column( 'address_address2' ) ) $select->add_constant( NULL, 'address_address2' );
    if( $select->has_column( 'address_city' ) ) $select->add_constant( NULL, 'address_city' );
    if( $select->has_column( 'address_postcode' ) ) $select->add_constant( NULL, 'address_postcode' );
    if( $select->has_column( 'address_note' ) ) $select->add_constant( NULL, 'address_note' );

    if( !is_null( $this->get_resource() ) )
    {
      // include the participant first/last/uid as supplemental data
      $select->add_column(
        'CONCAT( participant.first_name, " ", participant.last_name, " (", participant.uid, ")" )',
        'formatted_participant_id',
        false );
    }

    // restrict to participants in this application
    if( $db_application->release_based )
    {
      $sub_mod = lib::create( 'database\modifier' );
      $sub_mod->where( 'participant.id', '=', 'application_has_participant.participant_id', false );
      $sub_mod->where( 'application_has_participant.application_id', '=', $db_application->id );
      $sub_mod->where( 'application_has_participant.datetime', '!=', NULL );
      $modifier->join_modifier(
        'application_has_participant', $sub_mod, $db_application->release_based ? '' : 'left' );
    }

    $sub_mod = lib::create( 'database\modifier' );
    $sub_mod->where( 'participant.id', '=', 'participant_site.participant_id', false );
    $sub_mod->where( 'participant_site.application_id', '=', $db_application->id );
    $modifier->join_modifier( 'participant_site', $sub_mod, 'left' );
    $modifier->left_join( 'site', 'participant_site.site_id', 'site.id' );

    // restrict by site
    $db_restrict_site = $this->get_restricted_site();
    if( !is_null( $db_restrict_site ) ) $modifier->where( 'participant_site.site_id', '=', $db_restrict_site->id );

    $this->add_list_column( 'alternate_type_list', 'alternate_type', 'title', $select, $modifier );
  }

  /**
   * Extends parent method
   */
  public function post_write( $record )
  {
    parent::post_write( $record );

    if( $record && 'POST' == $this->get_method() )
    {
      $post_array = $this->get_file_as_array();

      // add the alternate_type association, if one was provided
      if( array_key_exists( 'alternate_type_id', $post_array ) )
        $record->add_alternate_type( $post_array['alternate_type_id'] );

      // add the phone record, if data has been provided
      $has_phone_data = false;
      foreach( array_keys( $post_array ) as $column )
      {
        if( 'phone_' == substr( $column, 0, 6 ) )
        {
          $has_phone_data = true;
          break;
        }
      }
      if( $has_phone_data )
      {
        // make sure all required phone data exists
        if( !array_key_exists( 'phone_type', $post_array ) ||
            !array_key_exists( 'phone_number', $post_array ) )
          throw lib::create( 'exception\notice',
            'When providing phone data along with the new alternate you must provide type and number.',
            __METHOD__ );

        try
        {
          $db_phone = lib::create( 'database\phone' );
          $db_phone->alternate_id = $record->id;
          $db_phone->active = true;
          $db_phone->rank = 1;
          $db_phone->type = $post_array['phone_type'];
          if( array_key_exists( 'phone_international', $post_array ) )
            $db_phone->international = $post_array['phone_international'];
          $db_phone->number = $post_array['phone_number'];
          if( array_key_exists( 'phone_note', $post_array ) ) $db_phone->note = $post_array['phone_note'];
          $db_phone->save();
        }
        catch( \cenozo\exception\database $e )
        {
          $this->get_status()->set_code( $e->is_missing_data() ? 400 : 500 );
          throw $e;
        }
      }

      // add the address record, if data has been provided
      $has_address_data = false;
      foreach( array_keys( $post_array ) as $column )
      {
        if( 'address_' == substr( $column, 0, 8 ) )
        {
          $has_address_data = true;
          break;
        }
      }
      if( $has_address_data )
      {
        // make sure all required address data exists
        if( !array_key_exists( 'address_address1', $post_array ) ||
            !array_key_exists( 'address_city', $post_array ) ||
            !array_key_exists( 'address_postcode', $post_array ) )
          throw lib::create( 'exception\notice',
            'When providing address data along with the new alternate you must provide '.
            'address1, city and postcode.',
            __METHOD__ );

        try
        {
          $db_address = lib::create( 'database\address' );
          $db_address->alternate_id = $record->id;
          $db_address->active = true;
          $db_address->rank = 1;
          if( array_key_exists( 'address_international', $post_array ) )
            $db_address->international = $post_array['address_international'];
          $db_address->address1 = $post_array['address_address1'];
          if( array_key_exists( 'address_address2', $post_array ) )
            $db_address->address2 = $post_array['address_address2'];
          $db_address->city = $post_array['address_city'];
          $db_address->postcode = $post_array['address_postcode'];
          if( array_key_exists( 'address_note', $post_array ) ) $db_address->note = $post_array['address_note'];
          $db_address->save();
        }
        catch( \cenozo\exception\database $e )
        {
          $this->get_status()->set_code( $e->is_missing_data() ? 400 : 500 );
          throw $e;
        }
      }
    }
  }
}
