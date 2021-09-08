<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * Performs operations which effect how this module is used in a service
 */
abstract class site_restricted_participant_module extends site_restricted_module
{
  /**
   * Extends parent method by taking the module's resource into account
   */
  public function get_restricted_site()
  {
    $db_restricted_site = parent::get_restricted_site();

    // check if we are in an assignment with the participant (don't bother if there is no site restriction)
    if( !is_null( $db_restricted_site ) )
    {
      $record = $this->get_resource();
      if( !is_null( $record ) )
      {
        // get the participant from the provided record
        $db_participant = NULL;
        if( !is_object( $record ) )
        {
          throw lib::create( 'exception\runtime',
            'Tried to get restricted site with non-object reference.',
            __METHOD__ );
        }
        else if( is_a( $record, lib::get_class_name( 'database\participant' ) ) )
        {
          $db_participant = $record;
        }
        else if( is_a( $record, lib::get_class_name( 'database\alternate_consent' ) ) )
        {
          $db_participant = $record->get_alternate()->get_participant();
        }
        else if( is_a( $record, lib::get_class_name( 'database\assignment' ) ) )
        {
          $db_interview = $record->get_interview();
          if( !is_null( $db_interview ) ) $db_participant = $db_interview->get_participant();
        }
        else if( is_a( $record, lib::get_class_name( 'database\form_association' ) ) )
        {
          $db_participant = $record->get_form()->get_participant();
        }
        else if( is_a( $record, lib::get_class_name( 'database\phone_call' ) ) )
        {
          $db_assignment = $record->get_assignment();
          if( !is_null( $db_assignment ) )
          {
            $db_interview = $db_assignment->get_interview();
            if( !is_null( $db_interview ) ) $db_participant = $db_interview->get_participant();
          }
        }
        else if( $record->column_exists( 'participant_id' ) )
        {
          $db_participant = $record->get_participant();
        }
        else
        {
          throw lib::create( 'exception\runtime',
            sprintf( 'Tried to get restricted site with reference to %s, but no relationship could be found.',
                     $record->get_class_name() ),
            __METHOD__ );
        }

        if( !is_null( $db_participant ) )
        {
          $setting_manager = lib::create( 'business\setting_manager' );
          if( $setting_manager->get_setting( 'module', 'interview' ) )
          {
            $db_assignment = lib::create( 'business\session' )->get_user()->get_open_assignment();
            if( !is_null( $db_assignment ) && $db_assignment->get_interview()->participant_id == $db_participant->id )
              $db_restricted_site = NULL;
          }
        }
      }
    }

    return $db_restricted_site;
  }
}
