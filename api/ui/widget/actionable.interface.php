<?php
/**
 * actionable.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cenozo\ui\widget;

/**
 * Interface that specifies that a widget may contain a list of actions.
 */
interface actionable
{
  /**
   * Adds a new action to the widget.
   * 
   * @param string $action_id The action's id (must be a valid HTML id name).
   * @param string $heading The action's heading as it will appear in the widget.
   * @param database\operation $db_operation The operation to perform.  If NULL then the button
   *        will appear in the interface without any action and the extending template is
   *        expected to implement the actions operation in the action_script block.
   * @param string $description Pop-up text to show when hovering over the action's button.
   * @access public
   */
  public function add_action( $action_id, $heading, $db_operation = NULL, $description = NULL );

  /**
   * Removes an action from the widget.
   * 
   * @param string $action_id The action's id (must be a valid HTML id name).
   * @access public
   */
  public function remove_action( $action_id );
}
