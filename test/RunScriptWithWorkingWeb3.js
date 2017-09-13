// i'm having to use this file to run the script....
// https://github.com/trufflesuite/truffle/issues/526

// use:
// RUN_SCRIPT='true' truffle test ./test/RunScriptWithWorkingWeb3.js
// to make this work

if (!process.env.RUN_SCRIPT) { return null; }

require('../scripts/dgd-reward.js')();
