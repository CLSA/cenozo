<?php
/**
 * post.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service\participant;
use cenozo\lib, cenozo\log;

/**
 * The base class of all post services.
 */
class post extends \cenozo\service\service
{
  /**
   * Extends parent constructor
   */
  public function __construct( $path, $args, $file )
  {
    parent::__construct( 'POST', $path, $args, $file );
  }

  /**
   * Extends parent constructor
   */
  protected function validate()
  {
    $setting_manager = lib::create( 'business\setting_manager' );
    $db_role = lib::create( 'business\session' )->get_role();

    parent::validate();

    if( $this->may_continue() )
    {
      if( is_array( $this->get_file_as_object() ) );
      {
        $file = $this->get_file_as_object();

        // make sure only administrators can import participants (and that the feature is on)
        if( 3 > $db_role->tier || ( is_array( $file ) && !$setting_manager->get_setting( 'general', 'participant_import' ) ) )
          $this->status->set_code( 403 );
      }
    }
  }

  /**
   * Extends parent method
   */
  protected function execute()
  {
    parent::execute();

    $util_class_name = lib::get_class_name( 'util' );
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $setting_manager = lib::create( 'business\setting_manager' );
    $session = lib::create( 'business\session' );
    $db_application = $session->get_application();
    $db_site = $session->get_site();
    $db_role = $session->get_role();
    $db_user = $session->get_user();

    $file = $this->get_file_as_object();

    if( is_array( $file ) )
    {
      // import list of participants
      $error_message_list = array();
      foreach( $file as $index => $participant )
      {
        $message = $participant_class_name::import( $participant );
        if( !is_null( $message ) ) array_push( $error_message_list, sprintf( 'Error on line %d: %s', $index+1, $message ) );
      }

      $this->set_data( $error_message_list );
    }
    else
    {
      // This is a special service since participants cannot be added to the system through the web interface.
      // Instead, this service provides participant-based utility functions.
      if( property_exists( $file, 'identifier_list' ) )
      {
        $identifier_id = property_exists( $file, 'identifier_id' ) ? $file->identifier_id : NULL;
        $db_identifier = is_null( $identifier_id ) ? NULL : lib::create( 'database\identifier', $identifier_id );
        $identifier_list = $participant_class_name::get_valid_identifier_list( $db_identifier, $file->identifier_list );

        $select = lib::create( 'database\select' );
        $select->from( 'participant' );
        $select->add_column( 'id', 'participant_id' );
        $modifier = lib::create( 'database\modifier' );
        if( is_null( $identifier_id ) )
        {
          $modifier->where( 'uid', 'IN', $identifier_list );
        }
        else
        {
          $modifier->join( 'participant_identifier', 'participant.id', 'participant_identifier.participant_id' );
          $modifier->where( 'participant_identifier.identifier_id', '=', $identifier_id );
          $modifier->where( 'participant_identifier.value', 'IN', $identifier_list );
        }

        if( property_exists( $file, 'input_list' ) )
        { // change each column/value pair in the identifier list
          $this->set_data( $participant_class_name::multiedit( $modifier, (array) $file->input_list ) );
        }
        else if( property_exists( $file, 'consent' ) )
        { // add the given consent record to all participants in the identifier_list
          $db_consent = lib::create( 'database\consent' );
          foreach( $file->consent as $column => $value ) $db_consent->$column = $value;
          $this->set_data( $db_consent->save_list( $select, $modifier ) );
        }
        else if( property_exists( $file, 'collection' ) )
        { // add/remove participants from the given collection
          try
          {
            // validate the data
            if( !property_exists( $file->collection, 'id' ) ||
                !property_exists( $file->collection, 'operation' ) ||
                !in_array( $file->collection->operation, array( 'add', 'remove' ) ) )
            {
              $this->status->set_code( 400 ); // must provide a identifier_list
            }
            else
            {
              // get the list of participant ids
              $id_list = array_reduce(
                $participant_class_name::select( $select, $modifier ),
                function( $id_list, $row ) {
                  $id_list[] = $row['participant_id'];
                  return $id_list;
                },
                array()
              );

              if( 0 < count( $id_list ) )
              {
                $db_collection = lib::create( 'database\collection', $file->collection->id );
                if( 'add' == $file->collection->operation ) $db_collection->add_participant( $id_list );
                else $db_collection->remove_participant( $id_list );
              }
            }
          }
          catch( \cenozo\exception\runtime $e )
          {
            $this->status->set_code( 404 ); // collection doesn't exist
          }
        }
        else if( property_exists( $file, 'event' ) )
        { // add the given event record
          $db_event = lib::create( 'database\event' );
          $db_event->site_id = $db_site->id;
          $db_event->user_id = $db_user->id;
          foreach( $file->event as $column => $value ) $db_event->$column = $value;
          $this->set_data( $db_event->save_list( $select, $modifier ) );
        }
        else if( property_exists( $file, 'hold' ) )
        { // add the given hold record
          $db_hold = lib::create( 'database\hold' );
          foreach( $file->hold as $column => $value ) $db_hold->$column = $value;
          $modifier->join( 'participant_last_consent', 'participant.id', 'participant_last_consent.participant_id' );
          $modifier->join( 'consent_type', 'participant_last_consent.consent_type_id', 'consent_type.id' );
          $modifier->left_join( 'consent', 'participant_last_consent.consent_id', 'consent.id' );
          $modifier->where( 'consent_type.name', '=', 'participation' );
          $modifier->where( 'consent.accept', '=', true );

          $modifier->where( 'participant.exclusion_id', '=', NULL ); // only add holds to enrolled participants
          try
          {
            $this->set_data( $db_hold->save_list( $select, $modifier ) );
          }
          catch( \cenozo\exception\database $e )
          {
            throw $e->is_user_defined_error() ?
              lib::create( 'exception\notice',
                'One or more holds cannot be added. '.
                'Please check that all participants are not already in a hold which cannot be changed.',
                __METHOD__,
                $e ) : $e;
          }
        }
        else if( property_exists( $file, 'note' ) )
        { // add the given event record
          $db_note = lib::create( 'database\note' );
          foreach( $file->note as $column => $value ) $db_note->$column = $value;
          $db_note->user_id = $db_user->id;
          $db_note->datetime = $util_class_name::get_datetime_object();
          $this->set_data( $db_note->save_list( $select, $modifier ) );
        }
        else if( property_exists( $file, 'study' ) )
        { // add/remove participants from the given study
          try
          {
            // validate the data
            if( !property_exists( $file->study, 'id' ) ||
                !property_exists( $file->study, 'operation' ) ||
                !in_array( $file->study->operation, array( 'add', 'remove' ) ) )
            {
              $this->status->set_code( 400 ); // must provide a identifier_list
            }
            else
            {
              // get the list of participant ids
              $id_list = array_reduce(
                $participant_class_name::select( $select, $modifier ),
                function( $id_list, $row ) {
                  $id_list[] = $row['participant_id'];
                  return $id_list;
                },
                array()
              );

              if( 0 < count( $id_list ) )
              {
                $db_study = lib::create( 'database\study', $file->study->id );
                if( 'add' == $file->study->operation ) $db_study->add_participant( $id_list );
                else $db_study->remove_participant( $id_list );
              }
            }
          }
          catch( \cenozo\exception\runtime $e )
          {
            $this->status->set_code( 404 ); // study doesn't exist
          }
        }
        else // return a list of all valid identifiers
        {
          $this->set_data( $identifier_list );
        }
      }
      else $this->status->set_code( 400 ); // must provide a identifier_list
    }
  }

  /**
   * Extends parent method
   */
  protected function create_resource( $index )
  {
    return NULL;
  }
}
