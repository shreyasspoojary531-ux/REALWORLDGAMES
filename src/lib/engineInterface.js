/**
 * GameEngine base contract
 * Every game engine must adhere to this interface:
 * Pure logic, no React, 100% testable, serializable for save/resume.
 */
export class GameEngine {
  /**
   * Initializes the engine with optional config/seed/difficulty
   * @param {Object} [_config]
   */
  init(_config = {}) {
    throw new Error('init() must be implemented');
  }

  /**
   * Returns list or map of valid actions in current state
   * @returns {Array|Object}
   */
  getLegalActions() {
    throw new Error('getLegalActions() must be implemented');
  }

  /**
   * Applies an action to the engine state
   * @param {Object} [_action]
   * @returns {Object} result metadata
   */
  applyAction(_action) {
    throw new Error('applyAction() must be implemented');
  }

  /**
   * Checks if current state is terminal (win, lose, draw)
   * @returns {boolean}
   */
  isTerminal() {
    throw new Error('isTerminal() must be implemented');
  }

  /**
   * Computes current score or winner metadata
   * @returns {Object}
   */
  getScore() {
    throw new Error('getScore() must be implemented');
  }

  /**
   * Serializes complete state to JSON string or plain object
   * @returns {Object}
   */
  serialize() {
    throw new Error('serialize() must be implemented');
  }

  /**
   * Restores engine from serialized state
   * @param {Object|string} [_data]
   */
  deserialize(_data) {
    throw new Error('deserialize() must be implemented');
  }
}
