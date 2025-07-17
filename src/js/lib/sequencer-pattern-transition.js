/**
 * Does a timed, column by column, transition to a pattern in a sequencer.
 *
 * @param {MuskiSequencer} sequencer
 *   The sequencer to transition the pattern in.
 * @param {Array<Array>} pattern
 *   The sequence is returned as an array of arrays, where each sub-array contains the row IDs of
 *   the cells that are 'on' in each column.
 * @param {Number} duration
 *   The duration of the transition in milliseconds.
 * @param {Object} [options={}]
 *   Optional parameters for the transition.
 * @param {Number} [options.startCol=0]
 *   The column to start the transition from. Defaults to 0.
 * @param {Number} [options.endCol=pattern.length - 1]
 *   The column to end the transition at. Defaults to the last column of the pattern.
 * @param {Function} [options.onStart]
 *   Callback function to call when the transition starts
 * @param {Function} [options.onEnd]
 *   Callback function to call when the transition ends
 * @param {Function} [options.onCell]
 *   Callback function to call for each cell transition.
 */
export default function sequencerPatternTransition(
  sequencer,
  pattern,
  duration,
  options = {}
) {
  const {
    startCol = 0,
    endCol = pattern.length - 1,
    onStart,
    onEnd,
    onCell,
  } = options;

  const totalCols = endCol - startCol + 1;
  if (totalCols <= 0) return;

  const interval = duration / totalCols;
  const { rows } = sequencer.options;

  if (typeof onStart === 'function') onStart();

  let col = startCol;

  function applyColumn(c) {
    // pattern[c] is an array of row IDs that should be 'on' in column c
    const onRows = pattern[c] || [];
    for (let r = 0; r < rows.length; r += 1) {
      const rowId = rows[r];
      const cellState = onRows.includes(rowId);
      sequencer.setCell(rowId, c, cellState);
      if (typeof onCell === 'function') onCell(rowId, c, cellState);
    }
  }

  function step() {
    applyColumn(col);
    col += 1;
    if (col > endCol) {
      if (typeof onEnd === 'function') onEnd();
      return;
    }
    setTimeout(step, interval);
  }

  step();
}
