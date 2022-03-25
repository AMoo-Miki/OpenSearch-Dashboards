/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

const fs = require('fs-extra');
const events = require('events');
const readline = require('readline');
const { spawn, execSync } = require('child_process');
const { queue } = require('async');

const q = queue(async (task) => {
  //console.log('Processing', task.file);

  let i = 0;
  let temp;
  let hasHeader = false;
  let done = false;
  let hasNew = false;
  let hasUnmodified = false;
  let hasModified = false;
  let hasElastic = false;

  const rl = readline.createInterface({
    input: fs.createReadStream(task.file),
    crlfDelay: Infinity,
  });
  rl.on('line', (line) => {
    if (done) return;
    const cleanLine = line.trim();
    i++;
    //console.log(i, cleanLine);
    if (/^\s*(\/\*+(\s|$)|\*+(\s|\/|$))/.test(cleanLine)) {
      hasHeader = true;
      if (cleanLine.indexOf('Licensed to Elasticsearch') > 0) hasElastic = true;
      else if (cleanLine.indexOf('The OpenSearch Contributors require') > 0) hasUnmodified = true;
      else if (cleanLine.indexOf('Modifications Copyright OpenSearch') > 0) hasModified = true;
      else if (/Copyright OpenSearch Contributors\s*$/.test(cleanLine)) hasNew = true;
    } else if (cleanLine) {
      done = true;
      rl.close();
    }

    if (!hasHeader && i > 10) {
      i = 0;
      done = true;
      rl.close();
    }
  });

  await events.once(rl, 'close');

  if (!hasHeader && i > 10) {
    i = 0;
  }

  temp = execSync(`git log -1 --format="%at" -s -L${i}:${task.file}`);
  let changedRecently = parseInt(temp.toString()) > 1611000000;

  if (!changedRecently) {
    temp = execSync(`git log -1 --format="%at" --follow --diff-filter=R -- ${task.file}`);
    changedRecently = parseInt(temp.toString()) > 1611000000;
  }

  temp = execSync(`git log --follow --format="%at" -- ${task.file} | sort | head -1`);
  const createdRecently = parseInt(temp.toString()) > 1611000000;

  if (createdRecently) {
    // Should only have New
    if (hasElastic && !hasModified) console.error('Found Elastic w/o Modified:', task.file);
    else if (hasModified) console.error('Found Modified:', task.file);
    else if (hasUnmodified) console.error('Found Unmodified:', task.file);
    else if (!hasNew) console.error('Missing New:', task.file);
  } else if (changedRecently) {
    // Should have long version
    if (hasNew) console.error('Found New:', task.file);
    else if (!hasUnmodified || !hasModified) console.error('Missing OSD:', task.file);
  } else {
    // Should have short version
    if (hasNew) console.error('Found New:', task.file);
    else if (hasElastic && !hasUnmodified) console.error('Missing Unmodified on Old:', task.file);
    else if (hasModified) {
      let cnt = await fs.readFile(task.file, 'utf8');
      cnt = cnt.replace(
        /^\s+\*\s*[\r\n]+\s+\* Modifications Copyright OpenSearch Contributors. See[\r\n]+\s+\* GitHub history for details\.[\r\n]+/m,
        ''
      );
      await fs.outputFile(task.file, cnt, 'utf8');
      console.error('Found Modified on Old:', task.file);
    }
  }
}, 10);
/* */
const list = spawn('git', ['ls-tree', '-r', '--name-only', 'HEAD', '..']);
const rl = readline.createInterface({
  input: list.stdout,
});

rl.on('line', (line) => {
  if (/\.(ts|js)x?$/.test(line)) q.push({ file: line });
});
/*/
q.push({ file: '../Gruntfile.js' });
/* */
