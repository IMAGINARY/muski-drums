export default class MuskiSequencer {
  /**
   * Construct a sequencer.
   *
   * @param {object} options
   * @param {array} options.rows
   *   The rows in the sequencer, as an array of pitches.
   * @param {array} options.rowLabels
   *  (optional) The labels for the rows in the sequencer.
   * @param {number} options.cols
   *  (optional, default: 16) The number of columns in the sequencer.
   * @param {boolean} options.labelColumns
   *  (optional, default: true) Whether to label the columns.
   */
  constructor(options) {
    const defaultOptions = {
      cols: 16,
      labelColumns: true,
      rowLabels: null,
    };

    if (!options.rows || !Array.isArray(options.rows)) {
      throw new Error('Options should contain a `rows` property.');
    }

    this.options = Object.assign({}, defaultOptions, options);

    this.$element = $('<div></div>')
      .addClass('muski-sequencer');

    this.$cellButtons = { };
    for (let row = 0; row < this.options.rows.length; row += 1) {
      const rowButtons = [];
      for (let col = 0; col < this.options.cols; col += 1) {
        const $cellButton = $('<button></button>')
          .attr('type', 'button')
          .addClass('muski-sequencer-cell')
          .attr('data-row', options.rows[row])
          .attr('data-col', col)
          .on('click', () => {
            this.toggleCell(options.rows[row], col);
          });
        rowButtons.push($cellButton);
      }
      this.$cellButtons[String(options.rows[row])] = rowButtons;
    }

    this.$table = $('<table></table>')
      .addClass('muski-sequencer-matrix');

    if (this.options.labelColumns) {
      const $colLabelsRow = $('<tr></tr>')
        .addClass('muski-sequencer-col-labels');
      if (options.rowLabels !== null) {
        $colLabelsRow.append($('<th></th>'));
      }
      for (let col = 0; col < this.options.cols; col += 1) {
        const $colLabelCell = $('<th></th>')
          .addClass('muski-sequencer-col-label')
          .text(col + 1);
        $colLabelsRow.append($colLabelCell);
      }
      this.$table.append($colLabelsRow);
    }

    for (let row = 0; row < this.options.rows.length; row += 1) {
      const $row = $('<tr></tr>')
        .addClass('muski-sequencer-row');
      if (options.rowLabels !== null) {
        const $rowLabelCell = $('<th></th>')
          .addClass('muski-sequencer-row-label')
          .text(options.rowLabels[row] || '');
        $row.append($rowLabelCell);
      }
      for (let col = 0; col < this.options.cols; col += 1) {
        $row.append($('<td></td>')
          .append(this.$cellButtons[String(options.rows[row])][col]));
      }
      this.$table.append($row);
    }

    this.$element.append(this.$table);
  }

  /**
   * Clear all cells in a range
   *
   * @param colFrom
   * @param colTo
   */
  clear(colFrom = 0, colTo = null) {
    const colFromActual = Math.max(0, colFrom);
    const colToActual = colTo === null ? this.options.cols :
      Math.max(0, Math.min(colTo, this.options.cols));

    // Set all cells in the range to inactive.
    for (let row = 0; row < this.options.rows.length; row += 1) {
      for (let col = colFromActual; col < colToActual; col += 1) {
        this.setCell(this.options.rows[row], col, false);
      }
    }
  }

  /**
   * Validate row and column identifiers.
   *
   * Throws an error if they're invalid.
   *
   * @param {string} row
   *  Row ID.
   * @param {number} col
   *  Column number.
   */
  validateRowCol(row, col) {
    if (this.$cellButtons[String(row)] === undefined) {
      throw new Error(`Row ${row} does not exist.`);
    }
    if (col < 0 || col >= this.options.cols) {
      throw new Error(`Column ${col} does not exist.`);
    }
  }

  /**
   * Toggle a cell.
   * @param {string} row
   *  Row ID.
   * @param {number} col
   *  Column number.
   */
  toggleCell(row, col) {
    this.validateRowCol(row, col);
    this.$cellButtons[String(row)][col].toggleClass('active');
  }

  /**
   * Set a cell.
   * @param {string} row
   *  Row ID.
   * @param {number }col
   *  Column number.
   * @param active
   *  Whether the cell should be active.
   */
  setCell(row, col, active) {
    this.validateRowCol(row, col);
    this.$cellButtons[String(row)][col].toggleClass('active', active);
  }

  /**
   * Get the active status of a cell
   *
   * @param {string} row
   *  Row ID.
   * @param {number} col
   *  Column number.
   * @returns {boolean}
   */
  getCell(row, col) {
    this.validateRowCol(row, col);
    return this.$cellButtons[String(row)][col].hasClass('active');
  }

  /**
   * Get the sequence.
   *
   * The sequence is returned as an array of arrays, where each sub-array
   * contains the row IDs of the active cells in each column.
   */
  getSequence() {
    const sequence = [];
    for (let col = 0; col < this.options.cols; col += 1) {
      const activeCells = [];
      for (let row = 0; row < this.options.rows.length; row += 1) {
        if (this.getCell(this.options.rows[row], col)) {
          activeCells.push(this.options.rows[row]);
        }
      }
      sequence.push(activeCells);
    }
    return sequence;
  }
}
