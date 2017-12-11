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
   * Extends parent method
   */
  protected function execute()
  {
    parent::execute();

    $util_class_name = lib::get_class_name( 'util' );
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $session = lib::create( 'business\session' );
    $db_application = $session->get_application();
    $db_site = $session->get_site();
    $db_role = $session->get_role();
    $db_user = $session->get_user();

    // This is a special service since participants cannot be added to the system through the web interface.
    // Instead, this service provides participant-based utility functions.
    $file = $this->get_file_as_array();
    if( array_key_exists( 'uid_list', $file ) )
    {
      $uid_list = $participant_class_name::get_valid_uid_list( $file['uid_list'] );
      $select = lib::create( 'database\select' );
      $select->from( 'participant' );
      $select->add_column( 'id', 'participant_id' );
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'uid', 'IN', $uid_list );

      if( array_key_exists( 'input_list', $file ) )
      { // change each column/value pair in the uid-list
        $this->set_data( $participant_class_name::multiedit( $modifier, (array) $file['input_list'] ) );
      }
      else if( array_key_exists( 'consent', $file ) )
      { // add the given consent record to all participants in the uid_list
        $db_consent = lib::create( 'database\consent' );
        foreach( $file['consent'] as $column => $value ) $db_consent->$column = $value;
        $this->set_data( $db_consent->save_list( $select, $modifier ) );
      }
      else if( array_key_exists( 'collection', $file ) )
      { // add/remove participants from the given collection
        try
        {
          // validate the data
          if( !property_exists( $file['collection'], 'id' ) ||
              !property_exists( $file['collection'], 'operation' ) ||
              !in_array( $file['collection']->operation, array( 'add', 'remove' ) ) )
          {
            $this->status->set_code( 400 ); // must provide a uid_list
          }
          else
          {
            // get the collection
            $db_collection = lib::create( 'database\collection', $file['collection']->id );

            // get the list of participant ids
            $id_list = array_reduce(
              $participant_class_name::select( $select, $modifier ),
              function( $id_list, $row ) { $id_list[] = $row['participant_id']; return $id_list; },
              array()
            );

            if( 0 < count( $id_list ) )
            {
              if( 'add' == $file['collection']->operation ) $db_collection->add_participant( $id_list );
              else $db_collection->remove_participant( $id_list );
            }
          }
        }
        catch( \cenozo\exception\runtime $e )
        {
          $this->status->set_code( 404 ); // collection doesn't exist
        }
      }
      else if( array_key_exists( 'event', $file ) )
      { // add the given event record
        $db_event = lib::create( 'database\event' );
        foreach( $file['event'] as $column => $value ) $db_event->$column = $value;
        $this->set_data( $db_event->save_list( $select, $modifier ) );
      }
      else if( array_key_exists( 'hold', $file ) )
      { // add the given hold record
        $db_hold = lib::create( 'database\hold' );
        foreach( $file['hold'] as $column => $value ) $db_hold->$column = $value;
        $modifier->where( 'participant.exclusion_id', '=', NULL ); // only add holds to enrolled participants
        $this->set_data( $db_hold->save_list( $select, $modifier ) );
      }
      else if( array_key_exists( 'note', $file ) )
      { // add the given event record
        $db_note = lib::create( 'database\note' );
        foreach( $file['note'] as $column => $value ) $db_note->$column = $value;
        $db_note->user_id = $db_user->id;
        $db_note->datetime = $util_class_name::get_datetime_object();
        $this->set_data( $db_note->save_list( $select, $modifier ) );
      }
      else // return a list of all valid uids
      {
        $this->set_data( $uid_list );
      }
    }
    else $this->status->set_code( 400 ); // must provide a uid_list
  }

  /**
   * Extends parent method
   */
  protected function create_resource( $index )
  {
    return NULL;
  }
}
