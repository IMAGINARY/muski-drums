import EventEmitter from 'events';

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
   * @param {string} options.monophonic
   *  (optional, default: false) Whether more than one row can be active in a column.
   * @param {[number]} options.isLockedCol
   *  (optional) Columns that should be locked (not editable by the user) as 0-based indices.
   */
  constructor(options) {
    const defaultOptions = {
      cols: 16,
      labelColumns: true,
      rowLabels: null,
      monophonic: false,
    };

    if (!options.rows || !Array.isArray(options.rows)) {
      throw new Error('Options should contain a `rows` property.');
    }

    this.options = { ...defaultOptions, ...options };

    this.events = new EventEmitter();

    this.activeColumn = null;

    this.isLockedCol = [];
    this.options.lockedColumns.forEach((col) => {
      if (col >= 0 && col < this.options.cols) {
        this.isLockedCol[col] = true;
      }
    });

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
            this.handleCellClick(options.rows[row], col);
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
    const colToActual = colTo === null
      ? this.options.cols
      : Math.max(0, Math.min(colTo, this.options.cols));

    // Turn all cells in the range off.
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
    this.setCell(row, col, this.getCell(row, col) === false);
  }

  /**
   * Set a cell.
   * @param {string} row
   *  Row ID.
   * @param {number }col
   *  Column number.
   * @param state
   *  Whether the cell should be on.
   */
  setCell(row, col, state) {
    this.validateRowCol(row, col);
    if (this.options.monophonic && state) {
      this.clear(col, col + 1);
    }

    this.$cellButtons[String(row)][col].toggleClass('on', state);
  }

  /**
   * Get the state of a cell
   *
   * @param {string} row
   *  Row ID.
   * @param {number} col
   *  Column number.
   * @returns {boolean}
   */
  getCell(row, col) {
    this.validateRowCol(row, col);
    return this.$cellButtons[String(row)][col].hasClass('on');
  }

  /**
   * Get the sequence.
   *
   * The sequence is returned as an array of arrays, where each sub-array
   * contains the row IDs of the cells that are 'on' in each column.
   */
  getSequence() {
    const sequence = [];
    for (let col = 0; col < this.options.cols; col += 1) {
      const onCells = [];
      for (let row = 0; row < this.options.rows.length; row += 1) {
        if (this.getCell(this.options.rows[row], col)) {
          onCells.push(this.options.rows[row]);
        }
      }
      sequence.push(onCells);
    }
    return sequence;
  }

  /**
   * Set the active column
   *
   * The previously active column is deactivated.
   *
   * @param {number|null} col
   *   The column number, or null to clear the active column.
   */
  setActiveColumn(col) {
    // If there's a previously active column, remove the active class from every cell.
    if (this.activeColumn !== null) {
      for (let row = 0; row < this.options.rows.length; row += 1) {
        this.$cellButtons[String(this.options.rows[row])][this.activeColumn].removeClass('active');
      }
    }

    // Set every cell in the new column to active.
    if (col !== null) {
      for (let row = 0; row < this.options.rows.length; row += 1) {
        this.$cellButtons[String(this.options.rows[row])][col].addClass('active');
      }
    }
    this.activeColumn = col;
  }

  /**
   * Lock or unlock a range of columns.
   *
   * @param {number} from
   *  The first column to lock or unlock (0-based index).
   * @param {number} to
   *  The last column to lock or unlock (0-based index).
   * @param {boolean} lock
   *  Whether to lock or unlock the columns.
   */
  lockColumns(from, to, lock = true) {
    for (let col = from; col <= to; col += 1) {
      this.isLockedCol[col] = lock;
    }
  }

  handleCellClick(row, col) {
    if (this.isLockedCol[col]) {
      return;
    }
    const isOn = this.getCell(row, col);
    this.setCell(row, col, !isOn);
    this.events.emit(isOn ? 'cell-off' : 'cell-on', row, col);
    this.events.emit('update');
  }
}
