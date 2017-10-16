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
   * @return string The raw contents of the PDF file (NULL if no form is created)
   * @access public
   */
  public function generate( $db_participant )
  {
    $opal_manager = lib::create( 'business\opal_manager' );

    // make sure the input is a valid database\participant object
    if( !is_a( $db_participant, lib::get_class_name( 'database\participant' ) ) )
      throw lib::create( 'exception\argument', 'db_participant', $db_participant, __METHOD__ );

    $data = NULL;

    if( $opal_manager->get_enabled() )
    {
      try
      {
        // if the participant has no data then an argument exception is thrown
        // (silently caught below effectively preventing the form from being created)
        $form_data = $opal_manager->get_values( 'mastodon', $this->name, $db_participant );
        $form_data['NAME'] = sprintf( '%s %s', $db_participant->first_name, $db_participant->last_name );

        $filename = sprintf( '%s/%s.pdf', TEMP_PATH, rand( 1000000000, 9999999999 ) );
        $pdf_template = sprintf(
          '%s/%s.%s.pdf',
          OPAL_FORM_TEMPLATE_PATH,
          $this->name,
          array_key_exists( 'LANGUAGE', $form_data ) ?
            $form_data['LANGUAGE'] : $db_participant->get_language()->code
        );

        if( !file_exists( $pdf_template ) )
        {
          log::warning( 'Unable to find a PDF template "%s"', $pdf_template );
        }
        else
        {
          // create the pdf file and write to it
          $pdf = new \mikehaertl\pdftk\Pdf( $pdf_template );
          if( !$pdf->fillForm( $form_data )->needAppearances()->saveAs( $filename ) )
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

          // read the file into a string and delete it
          $handle = fopen( $filename, 'r' );
          $data = fread( $handle, filesize( $filename ) );
          fclose( $handle );
          unlink( $filename );
        }
      }
      catch( \cenozo\exception\argument $e )
      {
        // ignore argument errors as they simply mean the participant does not have data
      }
    }

    return $data;
  }
}
