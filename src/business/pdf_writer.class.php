<?php
/**
 * pdf_writer.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\business;
use cenozo\lib, cenozo\log;

require_once MIKEHAERTL_PATH.'/php-shellcommand/src/Command.php';
require_once MIKEHAERTL_PATH.'/php-tmpfile/src/File.php';
require_once MIKEHAERTL_PATH.'/php-pdftk/src/Command.php';
require_once MIKEHAERTL_PATH.'/php-pdftk/src/Pdf.php';
require_once MIKEHAERTL_PATH.'/php-pdftk/src/FdfFile.php';
require_once MIKEHAERTL_PATH.'/php-pdftk/src/XfdfFile.php';

/**
 * Writes fillable PDF files
 */
class pdf_writer extends \cenozo\base_object
{
  /**
   * Constructor.
   * 
   * @access protected
   */
  public function __construct()
  {
    $setting_manager = lib::create( 'business\setting_manager' );
    if( !$setting_manager->get_setting( 'module', 'pdf' ) )
    {
      throw lib::create( 'exception\runtime',
        'Tried to create a pdf-writer but the pdf module is not enabled.',
        __METHOD__ );
    }

    $this->pdf = new \mikehaertl\pdftk\Pdf();
  }

  /**
   * Defines the PDF template to use
   * 
   * @param string|Pdf $pdf_template The PDF filename or Pdf instance to add for processing
   * @param string $handle One or more uppercase letters A..Z to reference this file later (can be left null)
   * @param string $password The PDF's password, if required
   * @access public
   */
  public function set_template( $pdf_template, $handle = NULL, $password = NULL )
  {
    $this->pdf->addFile( $pdf_template, $handle, $password );
    $this->pdf->needAppearances(); // always used when filling in PDF forms
  }

  /**
   * Fill the PDF template with data
   * 
   * @param string|array $data Either a XFDF/FDF filename or an array with form field data (name => value)
   * @param string $encoding The encoding of the data. Default is 'UTF-8'.
   * @access public
   */
  public function fill_form( $form_data, $encoding = 'UTF-8' )
  {
    $this->pdf->fillForm( $form_data, $encoding );
  }

  /**
   * Saves the PDF to a file
   * 
   * @param string $filename The name of the file to save to
   * @return boolean
   * @access public
   */
  public function save( $filename )
  {
    return $this->pdf->saveAs( $filename );
  }

  /**
   * The PDF resource which does all the work
   * @var \mikehaertl\pdftk\Pdf
   * @access protected
   */
  protected $pdf = NULL;
}
