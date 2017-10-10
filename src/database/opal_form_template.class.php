<?php
/**
 * opal_form_template.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @fileopal_form_template
 */

namespace cenozo\database;
use cenozo\lib, cenozo\log;

require_once MIKEHAERTL_PATH.'/php-shellcommand/src/Command.php';
require_once MIKEHAERTL_PATH.'/php-tmpfile/src/File.php';
require_once MIKEHAERTL_PATH.'/php-pdftk/src/Command.php';
require_once MIKEHAERTL_PATH.'/php-pdftk/src/Pdf.php';
require_once MIKEHAERTL_PATH.'/php-pdftk/src/FdfFile.php';
require_once MIKEHAERTL_PATH.'/php-pdftk/src/XfdfFile.php';

/**
 * opal_form_template: record
 */
class opal_form_template extends record
{
  /**
   * Creates the opal form for the given participant
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\participant @db_participant The participant to generate all forms for
   * @access public
   */
  public function generate( $db_participant )
  {
    $form_type_class_name = lib::get_class_name( 'database\form_type' );
    $form_class_name = lib::get_class_name( 'database\form' );
    $opal_manager = lib::create( 'business\opal_manager' );
    $db_form_type = $form_type_class_name::get_unique_record( 'name', 'opal_form' );

    // make sure the input is a valid database\participant object
    if( !is_a( $db_participant, lib::get_class_name( 'database\participant' ) ) )
      throw lib::create( 'exception\argument', 'db_participant', $db_participant, __METHOD__ );

    if( $opal_manager->get_enabled() && $db_form_type )
    {
      try
      {
        // if the participant has no data then an argument exception is thrown
        // (silently caught below effectively preventing the form from being created)
        $form_data = $opal_manager->get_values( 'mastodon', $this->name, $db_participant );
        $form_data['NAME'] = $db_participant->get_full_name( true );
        if( 'Participant Report (Baseline Site)' == $this->name ) log::debug( $form_data );

        // either create the form or get it if it already exists
        $db_form = $form_class_name::get_unique_record(
          array( 'participant_id', 'form_type_id', 'date' ),
          array( $db_participant->id, $db_form_type->id, $form_data['DATE'] )
        );
        if( !$db_form )
        {
          $db_form = lib::create( 'database\form' );
          $db_form->participant_id = $db_participant->id;
          $db_form->form_type_id = $db_form_type->id;
          $db_form->date = $form_data['DATE'];
          $db_form->save();
        }

        // write to the file to make sure it exists
        $db_form->write_file( '' );

        // create the pdf file and write to it
        $pdf = new \mikehaertl\pdftk\Pdf( sprintf(
          '%s/%s.%s.pdf',
          OPAL_FORM_TEMPLATE_PATH,
          $this->name,
          $db_participant->get_language()->code
        ) );
        if( !$pdf->fillForm( $form_data )->needAppearances()->saveAs( $db_form->get_filename() ) )
        {
          throw lib::create( 'exception\runtime',
            sprintf(
              'Failed to generate PDF file for Opal form "%s" for participant %s',
              $this->name,
              $db_participant->uid
            ),
            __METHOD__
          );
        }

        // let the form add any associations
        $db_form->add_opal_form( $this, $db_participant );
      }
      catch( \cenozo\exception\argument $e )
      {
        // ignore argument errors as they simply mean the participant does not have data
      }
    }
  }
}
