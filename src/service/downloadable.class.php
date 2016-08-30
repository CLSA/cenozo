<?php
/**
 * downloadable.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\service;
use cenozo\lib, cenozo\log;

/**
 * Special service for handling get resources with downloadable files
 */
abstract class downloadable extends get
{
  /**
   * Returns a list of all mime types the downloaded file is available as
   * This function must be replaced by extending classes
   * @return string
   * @access protected
   */
  protected function get_downloadable_mime_type_list()
  {
    // must be replaced, so throw an exception here
    throw lib::create( 'exception\runtime',
      sprintf( 'get_downloadable_public_name() has not been replaced for %s class', $this->get_class_name() ),
      __METHOD__ );
  }

  /**
   * Returns the public name of the file (the filename the web client will receive)
   * This function must be replaced by extending classes
   * @return string
   * @access protected
   */
  protected function get_downloadable_public_name()
  {
    // must be replaced, so throw an exception here
    throw lib::create( 'exception\runtime',
      sprintf( 'get_downloadable_public_name() has not been replaced for %s class', $this->get_class_name() ),
      __METHOD__ );
  }

  /**
   * Returns the local name of the file (its path on the server)
   * This function must be replaced by extending classes
   * @return string
   * @access protected
   */
  protected function get_downloadable_file_path()
  {
    // must be replaced, so throw an exception here
    throw lib::create( 'exception\runtime',
      sprintf( 'get_downloadable_file_path() has not been replaced for %s class', $this->get_class_name() ),
      __METHOD__ );
  }

  /**
   * Override parent method when the download argument is present
   */
  public function get_filename()
  {
    return $this->get_argument( 'download', false ) ?
      $this->get_downloadable_public_name() : parent::get_filename();
  }

  /**
   * Override parent method when the download argument is present
   */
  public function get_supported_mime_type_list()
  {
    return $this->get_argument( 'download', false ) ?
      $this->get_downloadable_mime_type_list() : parent::get_supported_mime_type_list();
  }

  /**
   * Override parent method
   */
  public function validate()
  {
    parent::validate();

    if( $this->get_argument( 'download', false ) )
    {
      $filename = $this->get_downloadable_file_path();
      if( is_readable( $filename ) ) $this->file_contents = @file_get_contents( $filename );
      if( is_null( $this->file_contents ) || false === $this->file_contents ) $this->status->set_code( 404 );
    }
  }

  /**
   * Override parent method since form is a meta-resource
   */
  public function execute()
  {
    parent::execute();

    // replace the data with the actual form, if requested
    if( $this->get_argument( 'download', false ) )
    {
      // since the file is already encoded
      $this->encode = false;
      $this->set_data( $this->file_contents );
    }
  }

  /**
   * The downloaded file's contents
   * @var binary $file_contents
   * @access private
   */
  private $file_contents = NULL;
}
