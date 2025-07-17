/**
 * Creates a 2D array (array of arrays) with specified dimensions.
 *
 * @param {number} outerLen - The length of the outer array.
 * @param {number} innerLen - The length of each inner array.
 * @param {* any} [value=false] - The value to fill the inner arrays with. Defaults to false.
 */
export default function arrayOfArrays(outerLen, innerLen, value = false) {
  const arr = [];
  for (let i = 0; i < outerLen; i += 1) {
    arr[i] = [];
    for (let j = 0; j < innerLen; j += 1) {
      arr[i][j] = value;
    }
  }
  return arr;
}
