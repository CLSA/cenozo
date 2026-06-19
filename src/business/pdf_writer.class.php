<?php
/**
 * pdf_writer.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cenozo\business;
use cenozo\lib, cenozo\log, \mikehaertl\pdftk;

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

    $this->pdf = new pdftk\Pdf();
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
   * Flattens the document making all fillable fields read-only
   * @access public
   */
  public function flatten()
  {
    $this->pdf->flatten();
  }

  /**
   * Stamps an image onto a PDF document, returning true if successful and false if not
   * 
   * @param string $pdf_filename The filename of the PDF file to stamp (must be flattened)
   * @param string $pdf_dpi The PDF file's resolution in pixels per inch
   * @param string $stamp_filename The filename of the PDF file to stamp (it will be trimmed)
   * @param string $stamp_page Which page to stamp the image onto
   * @param string $box_left_inches The distance of the left side of the box from the left side of the page
   * @param string $box_bottom_inches The distance of the bottom of the box from the bottom of the page
   * @param string $box_right_inches The distance of the right side of the box from the left side of the page
   * @param string $box_top_inches The distance of the top of the box from the bottom of the page
   * @return boolean 
   */
  public function stamp_signature(
    $pdf_filename,
    $pdf_dpi,
    $stamp_filename,
    $stamp_page,
    $box_left_inches,
    $box_bottom_inches,
    $box_right_inches,
    $box_top_inches
  ) {
    // default padding
    $sig_xpad = 1.15;
    $sig_ypad = 1.30;

    $box_width_inches = $box_right_inches - $box_left_inches;
    $box_height_inches = $box_top_inches - $box_bottom_inches;

    // put files into a unique directory name to avoid process collisions
    $unique_identifier = bin2hex( openssl_random_pseudo_bytes( 4 ) );
    $working_path = sprintf( '%s/%s', TEMP_PATH, $unique_identifier );
    mkdir( $working_path );
    $multistamp_filename = sprintf( '%s/stamp.pdf', $working_path );

    // get the dimensions of all pages in the template
    $pages = [];
    $result = exec( sprintf( 'identify -format "%%wx%%h;" "%s"', $pdf_filename ) );
    if( false === $result ) return false;
    foreach( explode( ';', substr( $result, 0, -1 ) ) as $index => $extent )
    {
      $page = $index + 1;
      [$page_width, $page_height] = explode( 'x', $extent );
      $page_filename = sprintf( '%s/page%d.pdf', $working_path, $page );
      $pages[] = $page_filename;

      // convert measurements from inches to pixels
      $box_left = round( $box_left_inches * $pdf_dpi );
      $box_bottom = round( $page_height - $box_bottom_inches * $pdf_dpi );
      $box_width = round( $box_width_inches * $pdf_dpi );
      $box_height = round( $box_height_inches * $pdf_dpi );
      $box_slope = $box_height / $box_width;

      if( $page == $stamp_page )
      {
        $tsig_filename = sprintf( '%s/tsig.png', $working_path );

        // trim the signature file and determine its dimensions
        $result = exec( sprintf(
          'convert "%s" -fuzz 10%% -trim +repage -transparent white %s',
          $stamp_filename,
          $tsig_filename
        ) );
        if( false === $result ) return false;
        $result = exec( sprintf( 'identify -format "%%wx%%h" "%s"', $tsig_filename ) );
        if( false === $result ) return false;
        [$tsig_width, $tsig_height] = explode( 'x', $result );

        // now pad the signature
        $tsig_width = round( $sig_xpad * $tsig_width );
        $tsig_height = round( $sig_ypad * $tsig_height );
        $tsig_slope = $tsig_height / $tsig_width;
        $result = exec( sprintf(
          'convert "%s" -gravity Center -extent %dx%d "%s"',
          $tsig_filename,
          $tsig_width,
          $tsig_height,
          $tsig_filename
        ) );
        if( false === $result ) return false;

        // The magnification factor helps to make the signature clear in the final PDF
        // This value was determined by trial and error and is effectively arbitrary
        $magnification = 10;

        // determine whether to contrain the signature by width or height
        $resize_factor = $tsig_width / $box_width;
        if( $tsig_height / $resize_factor > $box_height ) $resize_factor = $tsig_height / $box_height;

        // add the trimmed signature to the page
        $result = exec( sprintf(
          'convert %s '.
            '-transparent white '.
            '-background transparent '.
            '-resize %d '.
            '-gravity SouthEast '.
            '-extent %dx%d "%s"',
          $tsig_filename,
          round( $magnification * $tsig_width / $resize_factor ),
          round( $magnification * ( $box_left + $tsig_width / $resize_factor ) ),
          round( $magnification * $box_bottom ),
          $tsig_filename
        ) );

        if( false === $result ) return false;

        // complete the page using the magnification
        $result = exec( sprintf(
          'convert "%s" -background transparent -gravity NorthWest -extent %dx%d "%s"',
          $tsig_filename,
          round( $magnification * $page_width ),
          round( $magnification * $page_height ),
          $page_filename
        ) );
        if( false === $result ) return false;
      }
      else
      {
        // create a blank page
        $result = exec( sprintf(
          'convert -size %dx%d xc:transparent "%s"',
          $page_width,
          $page_height,
          $page_filename
        ) );
        if( false === $result ) return false;
      }
    }

    // now join the pages into a single mask file
    $result = exec( sprintf( 'pdftk %s output "%s"', implode( ' ', $pages ), $multistamp_filename ) );
    if( false === $result ) return false;

    // and stamp the input file using a new instance of the pdftk class
    $pdf = new pdftk\Pdf();
    $pdf->addFile( $pdf_filename );
    $pdf->multiStamp( $multistamp_filename );
    $pdf->saveAs( $pdf_filename );

    // clean up
    exec( sprintf( 'rm -rf "%s"', $working_path ) );

    return true;
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
   * Returns the last error as reported by the PDF library
   * 
   * @return string
   * @access public
   */
  public function get_error()
  {
    return $this->pdf->getError();
  }

  /**
   * Merges 2 or more PDF files into a single file
   * 
   * @param array $filename_list A list of filenames to read and merge into a single file
   * @access public
   */
  public function merge( $filename_list )
  {
    $letter = 'A';
    foreach( $filename_list as $filename )
    {
      $this->pdf->addFile( $filename, $letter );
      $this->pdf->cat( null, null, $letter );
      $letter++;
    }
  }

  /**
   * The PDF resource which does all the work
   * @var pdftk\Pdf
   * @access protected
   */
  protected $pdf = NULL;
}
