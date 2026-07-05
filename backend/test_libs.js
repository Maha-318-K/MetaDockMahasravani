const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

async function test() {
  console.log('Testing pdf-parse:', typeof pdfParse);
  console.log('Testing mammoth.extractRawText:', typeof mammoth.extractRawText);
}
test();
