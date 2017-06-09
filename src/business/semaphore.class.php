<?php
/**
 * semaphore.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\business;
use cenozo\lib, cenozo\log;

/**
 * semaphore: handles all semaphore-based information
 *
 * The semaphore class is used to track all information from the time a user logs into the system
 * until they log out.
 */
class semaphore extends \cenozo\base_object
{
  /**
   * Constructor.
   * 
   * Creates a semaphore.  The semaphore will be addressed based on the full path of the file that
   * creates it such that all semaphores created in that file will be treated identically (will
   * reference the same semaphore).  An optional name parameter can be provided to distinguish
   * multiple semaphores within a single file.  This is only necessary if more than one semaphore
   * is used by a single file.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $name A reference name for the semaphore
   * @access protected
   */
  public function __construct( $name = NULL )
  {
    // get the name of the file which created this object to define the semaphore's key
    $backtrace = debug_backtrace( false );
    $this->key = self::get_key( $backtrace[1]['file'], $name );
  }

  /**
   * Acquire a semaphore
   * 
   * This will block other semaphores from proceeding until it is released by using the
   * release() method.  Note: the semaphore will be indexed based on the file name
   * of the code that calls this method so IT MUST be released in the same file.
   * @author Patrick Emond <emondpd@mcamster.ca>
   * @throws exception\notice
   * @access public
   */
  public function acquire()
  {
    // acquire the semaphore if it doesn't yet exist
    if( is_null( $this->resource ) )
    {
      // we need to complete any transactions before continuing
      $session = lib::create( 'business\session' );
      $session->get_database()->complete_transaction();

      // restart the iteration counting
      $this->iteration = 0;

      // attach the shared memory (must be done before incrementing the process count)
      $this->memory = shm_attach( $this->key, self::SHARED_MEMORY_SIZE );
      if( false === $this->memory )
      {
        log::err( 'Unable to aquire shared memory' );
        throw lib::create( 'exception\notice',
          'The server is busy, please wait a few seconds then click the refresh button.',
          __METHOD__ );
      }

      // increment the process count variable
      $process_count = $this->get_variable( self::PROCESS_COUNT_INDEX );
      if( is_null( $process_count ) ) $process_count = 0;
      $this->set_variable( self::PROCESS_COUNT_INDEX, $process_count + 1 );

      // get a semaphore resource (must be done after incrementing the process count)
      $this->resource = sem_get( $this->key );
      if( false === $this->resource || false === sem_acquire( $this->resource ) )
      {
        log::err( 'Unable to aquire semaphore' );
        throw lib::create( 'exception\notice',
          'The server is busy, please wait a few seconds then click the refresh button.',
          __METHOD__ );
      }
    }

    // track how many times this semaphore is used by a single process
    $this->iteration++;
  }

  /**
   * Release an earlier acquired semaphore
   * 
   * Once a semaphore is released the next process which acquired a semaphore will be allowed
   * to proceed.
   * This will release a semaphore and allow blocked processes to proceed Note: semaphores are
   * indexed based on the file name of the code that calls this method so this method must be
   * called by the same file that acquired the semaphore.
   * @author Patrick Emond <emondpd@mcamster.ca>
   * @throws exception\runtime
   * @access public
   */
  public function release()
  {
    if( is_null( $this->resource ) )
    {
      throw lib::create( 'exception\runtime',
        'Tried to release semaphore which has never been acquired',
        __METHOD__ );
    }

    // decrement this process' iteration and, if the count is now zero, release it
    $this->iteration--;

    if( 0 == $this->iteration )
    {
      // decrement the process count variable
      $process_count = $this->get_variable( self::PROCESS_COUNT_INDEX );
      if( is_null( $process_count ) )
      {
        log::err( 'Tried to decrement the process count for a semaphore but it '.
                  'already has a value of 0' );
      }
      else
      {
        $this->set_variable( self::PROCESS_COUNT_INDEX, $process_count - 1 );
      }

      // detach the shared memory
      if( !shm_detach( $this->memory ) )
        log::err( 'Unable to detach shared memory' );
      $this->memory = NULL;

      // release the semaphore
      if( !sem_release( $this->resource ) )
        log::err( 'Unable to release semaphore' );
      $this->resource = NULL;
    }
  }

  /**
   * Get the number of times a semaphore has been requested for a particular file (full path)
   * 
   * This will return the number of semaphores for the given file name.  This will include
   * a semaphore which is currently processing in addition to all blocked processes.
   * @author Patrick Emond <emondpd@mcamster.ca>
   * @param string $filename The full path of the filename index of the semaphore
   * @param string $name A reference name for the semaphore (may be NULL)
   * @return int
   * @throws exception\notice
   * @access public
   * @static
   */
  public static function get_process_count( $filename, $name = NULL )
  {
    $key = self::get_key( $filename, $name );
    $memory = shm_attach( $key, self::SHARED_MEMORY_SIZE );
    if( false === $memory )
    {
      log::err( 'Unable to aquire shared memory' );
      throw lib::create( 'exception\notice',
        'The server is busy, please wait a few seconds then click the refresh button.',
        __METHOD__ );
    }

    $value = 0;
    if( shm_has_var( $memory, self::PROCESS_COUNT_INDEX ) )
    {
      $value = shm_get_var( $memory, self::PROCESS_COUNT_INDEX );
      if( false === $value )
      {
        log::err( "Failed to retreive value from shared memory" );
        throw lib::create( 'exception\notice',
          'The server is busy, please wait a few seconds then click the refresh button.',
          __METHOD__ );
      }
    }

    return $value;
  }

  /**
   * Get the value of a variable from shared memory
   * 
   * This will return the value of a variable from shared memory based on its numerical index.
   * If the variable doesn't exit then NULL is returned.
   * @author Patrick Emond <emondpd@mcamster.ca>
   * @param int $index The index of the variable in shared memory to access
   * @throws exception\runtime
   * @throws exception\notice
   * @return int
   * @access public
   */
  protected function get_variable( $index )
  {
    // make sure we have a shared memory resource
    if( is_null( $this->memory ) )
      throw lib::create( 'exception\runtime',
        sprintf(
          'Called get_variable() without first acquiring the semaphore '.
          '(the memory resource for key %d is missing)',
          $this->key ),
        __METHOD__ );

    // get the variable from shared memory if it exists
    $value = NULL;
    if( shm_has_var( $this->memory, $index ) )
    {
      $value = shm_get_var( $this->memory, $index );
      if( false === $value )
      {
        log::err( "Failed to get variable from shared memory" );
        throw lib::create( 'exception\notice',
          'The server is busy, please wait a few seconds then click the refresh button.',
          __METHOD__ );
      }
    }

    return $value;
  }

  /**
   * Set the value of a variable in shared memory
   * 
   * This will set the value of a variable in shared memory based on its numerical index.
   * @author Patrick Emond <emondpd@mcamster.ca>
   * @param int $index The index of the variable in shared memory to access
   * @param mixed $value The value to set the variable to (anything serializable)
   * @throws exception\runtime
   * @throws exception\notice
   * @access public
   */
  protected function set_variable( $index, $value )
  {
    // make sure we have a shared memory resource
    if( is_null( $this->memory ) )
      throw lib::create( 'exception\runtime',
        sprintf(
          'Called set_variable() without first acquiring the semaphore '.
          '(the memory resource for key %d is missing)',
          $this->key ),
        __METHOD__ );

    // set the variable in shared memory
    // (there no need to check if it exists since it will create itself if it doesn't)
    if( !shm_put_var( $this->memory, self::PROCESS_COUNT_INDEX, $value ) )
    {
      log::err( "Failed to put variable in shared memory" );
      throw lib::create( 'exception\notice',
        'The server is busy, please wait a few seconds then click the refresh button.',
        __METHOD__ );
    }
  }

  /**
   * Returns an integer key based on a filename and semaphore name.
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param string $filename The full path of a filename
   * @param string $name An optional name for the semaphore
   * @return int
   * @access protected
   * @static
   */
  protected static function get_key( $filename, $name = NULL )
  {
    $value = crc32( $filename.( is_null( $name ) ? '' : '|'.$name ) );
    return crc32( $filename.( is_null( $name ) ? '' : '|'.$name ) );
  }

  /**
   * The amount of memory reserved by the shared memory resource
   * @const int
   */
  const SHARED_MEMORY_SIZE = 512;

  /**
   * The index of the process count variable in shared memory
   * @const int
   */
  const PROCESS_COUNT_INDEX = 1;

  /**
   * This semaphore's key (based on the filename which created the semaphore)
   * @var int
   * @access private
   */
  private $key = 0;

  /**
   * The system semaphore resource
   * @var resource
   * @access private
   */
  private $resource = NULL;

  /**
   * The system shared memory resource
   * @var resource
   * @access private
   */
  private $memory = NULL;

  /**
   * A count of how many times this semaphore has be requested by the same process
   * @var int
   * @access private
   */
  private $iteration = 0;
}
